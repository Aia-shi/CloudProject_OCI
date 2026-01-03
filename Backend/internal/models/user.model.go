package models

import "errors"

type CreateUserRequest struct {
	Username string `json:"username"`
	Passwd   string `json:"passwd"`
	Email    string `json:"email"`
}

func (cur *CreateUserRequest) Validate() error {
	if cur.Username == "" || cur.Passwd == "" || cur.Email == "" {
		return errors.New("missing required user fields")
	}
	return nil
}
