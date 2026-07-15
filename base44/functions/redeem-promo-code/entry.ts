import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return Response.json({ error: "Code is required" }, { status: 400 });
    }

    const upper = code.trim().toUpperCase();

    // Validate the promo code using service role (user cannot read all promo codes)
    const matches = await base44.asServiceRole.entities.PromoCode.filter({ code: upper, is_active: true });
    if (matches.length === 0) {
      return Response.json({ error: "Invalid or expired code. Please check and try again." }, { status: 400 });
    }

    const promo = matches[0];

    // Check expiry
    if (promo.expires_at && new Date() > new Date(promo.expires_at)) {
      return Response.json({ error: "This code has expired." }, { status: 400 });
    }

    // Atomically increment uses only if still under max_uses (prevents TOCTOU race)
    const incrementResult = await base44.asServiceRole.entities.PromoCode.updateMany(
      { id: promo.id, is_active: true, $expr: { $lt: ["$uses", promo.max_uses] } },
      { $inc: { uses: 1 } }
    );

    // If no document was updated, the code was already at max uses (another request beat us)
    if (!incrementResult || incrementResult.modified_count === 0) {
      return Response.json({ error: "This code has reached its maximum number of uses." }, { status: 400 });
    }

    // Calculate subscription expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + promo.duration_days);

    // Upsert subscription using service role
    const existing = await base44.asServiceRole.entities.UserSubscription.filter({ user_email: user.email });
    const payload = {
      plan: promo.plan,
      status: "active",
      spool_limit: promo.spool_limit,
      trial_ends_at: expiresAt.toISOString(),
      user_email: user.email,
      user_id: user.id,
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, payload);
    } else {
      await base44.asServiceRole.entities.UserSubscription.create(payload);
    }

    console.log(`Promo code ${upper} redeemed by ${user.email}, plan=${promo.plan}`);

    return Response.json({ plan: promo.plan, days: promo.duration_days });
  } catch (error) {
    console.error("redeem-promo-code error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});