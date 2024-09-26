INSERT INTO AccountNotifications (
    id,
    accountId,
    type,
    data,
    message,
    title,
    created
) VALUES (
    :id,
    :accountId,
    :type,
    :data,
    :message,
    :title,
    :created
);