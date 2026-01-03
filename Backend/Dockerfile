FROM golang:1.24.2-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o main cmd/app/main.go

FROM alpine:latest AS prod

WORKDIR /app

COPY --from=build /app/main /app/main

EXPOSE ${APP_PORT}

CMD ["./main"]
