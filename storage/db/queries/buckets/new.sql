INSERT INTO Buckets (
    id,
    description,
    created,
    archived,
    type
) VALUES (
    :id,
    :description,
    :created,
    0,
    :type
);