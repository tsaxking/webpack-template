DELETE FROM Version;
INSERT INTO Version (
    major,
    minor,
    patch
) VALUES (
    :major,
    :minor,
    :patch
);