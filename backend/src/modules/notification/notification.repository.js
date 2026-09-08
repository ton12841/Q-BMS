/**
 * Creates a workflow notification event and channel targets using the caller's
 * transaction client. Keeping this function transaction-aware means the
 * business record and its notification trigger are committed atomically.
 */
export async function createWorkflowNotification(
  client,
  {
    eventCode,
    sourceModule,
    entityType,
    entityId,
    payload = {},
    createdByUserId = null,
    targets = [],
  }
) {
  const eventResult = await client.query(
    `
      INSERT INTO notification_events (
        event_code,
        source_module,
        entity_type,
        entity_id,
        payload,
        created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      RETURNING *
    `,
    [
      eventCode,
      sourceModule,
      entityType,
      String(entityId),
      JSON.stringify(payload || {}),
      createdByUserId,
    ]
  );

  const event = eventResult.rows[0];

  for (const target of targets) {
    const channel = String(target.channel || '').toUpperCase();
    const targetType = String(target.targetType || '').toUpperCase();
    const targetValue = String(target.targetValue || '').trim();

    if (!channel || !targetType || !targetValue) continue;

    // Role/permission-targeted email cannot be resolved to a concrete mailbox
    // until role members and the Google Workspace mail transport are available.
    const deliveryStatus =
      channel === 'EMAIL' && !target.recipientEmail
        ? 'WAITING_RECIPIENT'
        : 'PENDING';

    await client.query(
      `
        INSERT INTO notification_targets (
          event_id,
          channel,
          target_type,
          target_value,
          recipient_user_id,
          recipient_email,
          delivery_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (event_id, channel, target_type, target_value) DO NOTHING
      `,
      [
        event.id,
        channel,
        targetType,
        targetValue,
        target.recipientUserId || null,
        target.recipientEmail || null,
        deliveryStatus,
      ]
    );
  }

  return event;
}
