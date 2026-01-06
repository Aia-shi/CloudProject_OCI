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
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message":"user created"}`))
}

func (u *UserHandler) LoginUser(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	loginData := models.LoginUserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&loginData); err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := loginData.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	token, err := u.UserService.LoginUser(ctx, &loginData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	cookie := &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		MaxAge:   24 * 3600,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	}

	http.SetCookie(w, cookie)

	w.WriteHeader(http.StatusOK)
}

func (uh *UserHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie := &http.Cookie{
		Name:     "auth_token",
		MaxAge:   0,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	}
	http.SetCookie(w, cookie)
}
