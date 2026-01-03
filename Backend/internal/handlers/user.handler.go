package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"smart-expense-planner-backend/internal/models"
	"smart-expense-planner-backend/internal/services"
)

type UserHandler struct {
	UserService services.UserService
}

func (uh *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Validate() != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := uh.UserService.CreateUser(r.Context(), &req); err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), StatusFromError(err))
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message":"user created"}`))
}
