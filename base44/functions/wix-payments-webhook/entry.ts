import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import jwt from 'npm:jsonwebtoken@9.0.2';

const PLAN_LIMITS = {
  hobby: 50,
  pro: 999999,
  lifetime: 999999,
};

function detectPlanFromName(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("hobby")) return "hobby";
  if (lower.includes("pro")) return "pro";
  if (lower.includes("lifetime")) return "lifetime";
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const WEBHOOK_PUBLIC_KEY = Deno.env.get("WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
    if (!WEBHOOK_PUBLIC_KEY) {
      console.error("Missing WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
      return new Response("Unauthorized", { status: 401 });
    }

    const requestBody = await req.text();

    let rawPayload;
    try {
      rawPayload = jwt.verify(requestBody, WEBHOOK_PUBLIC_KEY, { algorithms: ["RS256"] });
    } catch (e) {
      console.error("JWT verification failed:", e.message);
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(rawPayload.data);
    const eventData = JSON.parse(event.data);
    const eventType = event.eventType;

    console.log("Webhook eventType:", eventType);

    if (eventType === "wix.ecom.v1.order_approved") {
      const order = eventData.actionEvent.body.order;
      const checkoutId = order.checkoutId;

      console.log("Order approved, checkoutId:", checkoutId);

      // Find the pending subscription record
      const records = await base44.asServiceRole.entities.UserSubscription.filter({
        checkout_id: checkoutId,
      });

      if (records.length === 0) {
        console.warn("No pending subscription found for checkoutId:", checkoutId);
        return new Response("OK", { status: 200 });
      }

      const record = records[0];

      // Find subscription ID from line items
      let subscriptionId = null;
      for (const lineItem of order.lineItems || []) {
        if (lineItem.subscriptionInfo?.id) {
          subscriptionId = lineItem.subscriptionInfo.id;
          break;
        }
      }

      // Detect plan from item name if needed
      const itemName = order.lineItems?.[0]?.productName?.original || "";
      const detectedPlan = detectPlanFromName(itemName) || record.plan;
      const spoolLimit = PLAN_LIMITS[detectedPlan] ?? 20;

      await base44.asServiceRole.entities.UserSubscription.update(record.id, {
        status: "active",
        plan: detectedPlan,
        spool_limit: spoolLimit,
        subscription_id: subscriptionId || null,
      });

      console.log(`Activated plan=${detectedPlan} for user_email=${record.user_email}`);
    } else if (
      eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_canceled" ||
      eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_expired"
    ) {
      const subscriptionContract = eventData.actionEvent.body.subscriptionContract;
      const subscriptionId = subscriptionContract.id;

      console.log("Subscription ended:", subscriptionId, "eventType:", eventType);

      const records = await base44.asServiceRole.entities.UserSubscription.filter({
        subscription_id: subscriptionId,
      });

      if (records.length === 0) {
        console.warn("No subscription found for subscription_id:", subscriptionId);
        return new Response("OK", { status: 200 });
      }

      const newStatus = eventType.includes("canceled") ? "canceled" : "ended";

      await base44.asServiceRole.entities.UserSubscription.update(records[0].id, {
        status: newStatus,
        plan: "free",
        spool_limit: 20,
      });

      console.log(`Subscription ${newStatus} for subscription_id=${subscriptionId}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response("Internal Server Error", { status: 500 });
  }
});