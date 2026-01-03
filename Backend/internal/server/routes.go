package server

import (
	"net/http"

	"smart-expense-planner-backend/internal/handlers"
	"smart-expense-planner-backend/internal/middlewares"
	"smart-expense-planner-backend/internal/services"
)

func SetupRoutes() http.Handler {
	mux := http.NewServeMux()

	conn := NewConnection()

	userService := services.NewBaseUserService(conn)
	userHandler := handlers.UserHandler{
		UserService: &userService,
	}

	mux.HandleFunc("POST /user/register", userHandler.CreateUser)

	stack := middlewares.CreateStack(
		middlewares.Logging,
		middlewares.CorsMiddleware,
	)

	return stack(mux)
}
