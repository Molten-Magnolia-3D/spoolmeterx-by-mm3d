import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const PLANS = {
  pro: {
    name: "SpoolmeterX Pro — $5.99/mo",
    price: "5.99",
    spoolLimit: null, // unlimited
    subscription: true,
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { plan } = body;

    const planConfig = PLANS[plan];
    if (!planConfig) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const origin = req.headers.get("Origin") || "https://app.base44.com";

    const item = {
      name: planConfig.name,
      quantity: 1,
      price: planConfig.price,
    };

    if (planConfig.subscription) {
      item.subscriptionInfo = {
        subscriptionSettings: {
          frequency: "MONTH",
          autoRenewal: true,
        },
        title: planConfig.name,
        description: planConfig.spoolLimit
          ? `Track up to ${planConfig.spoolLimit} spools with FilamentFlow.`
          : "Unlimited spool tracking with FilamentFlow.",
      };
    }

    const WIX_API_KEY = Deno.env.get("WIX_PAYMENTS_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_PAYMENTS_SITE_ID");

    const wixRes = await fetch(
      "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: WIX_API_KEY,
          "wix-site-id": WIX_SITE_ID,
        },
        body: JSON.stringify({
          cart: {
            items: [item],
            customerInfo: { email: user.email },
          },
          callbackUrls: {
            postFlowUrl: `${origin}/`,
            thankYouPageUrl: `${origin}/upgrade-success`,
          },
        }),
      }
    );

    const wixData = await wixRes.json();

    if (!wixRes.ok) {
      console.error("Wix checkout error:", JSON.stringify(wixData));
      return Response.json(
        { error: wixData?.message || "Failed to create checkout" },
        { status: 500 }
      );
    }

    const checkoutId = wixData.checkoutSession.id;

    // Upsert a pending subscription record for this user
    const existing = await base44.asServiceRole.entities.UserSubscription.filter({
      user_email: user.email,
    });

    const record = {
      user_email: user.email,
      user_id: user.id,
      plan,
      status: "pending",
      checkout_id: checkoutId,
      spool_limit: planConfig.spoolLimit ?? 999999,
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, record);
    } else {
      await base44.asServiceRole.entities.UserSubscription.create(record);
    }

    console.log(`Checkout created for ${user.email}, plan=${plan}, checkoutId=${checkoutId}`);

    return Response.json({ redirectUrl: wixData.checkoutSession.redirectUrl });
  } catch (error) {
    console.error("create-checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});