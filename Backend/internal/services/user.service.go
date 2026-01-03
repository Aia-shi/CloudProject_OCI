package services

import (
	"context"
	"errors"
	"log"

	"smart-expense-planner-backend/internal/models"
	repository "smart-expense-planner-backend/internal/repositories"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/joho/godotenv/autoload"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	CreateUser(ctx context.Context, req *models.CreateUserRequest) error
}

type BaseUserService struct {
	Repo *repository.Queries
}

func NewBaseUserService(conn *pgxpool.Pool) BaseUserService {
	return BaseUserService{
		Repo: repository.New(conn),
	}
}

func (s *BaseUserService) CreateUser(ctx context.Context, req *models.CreateUserRequest) error {
	if err := req.Validate(); err != nil {
		return errors.New("wrong properties")
	}

	hashedPasswd, err := bcrypt.GenerateFromPassword([]byte(req.Passwd), bcrypt.DefaultCost)
	if err != nil {
		log.Println("password hashing failed:", err)
		return errors.New("internal failure")
	}

	err = s.Repo.CreateUser(ctx, repository.CreateUserParams{
		Username:   req.Username,
		Passwdhash: string(hashedPasswd),
		Email:      req.Email,
	})
	if err != nil {
		log.Println("create user failed:", err)
		return errors.New("internal failure")
	}

	return nil
}
