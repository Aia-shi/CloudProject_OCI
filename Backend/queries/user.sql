-- name: CreateUser :exec
INSERT INTO users (
    username,
    passwdhash,
    email
) VALUES (
    $1, $2, $3
);

