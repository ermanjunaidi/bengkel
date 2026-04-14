package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/bengkel/internal/database"
	"github.com/yourusername/bengkel/internal/domain"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var profile domain.Profile
	if err := database.DB.Where("username = ? AND password = ?", req.Username, req.Password).First(&profile).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// In a real app, you should return a JWT here
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": profile,
	})
}
