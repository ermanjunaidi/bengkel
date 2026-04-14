package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/bengkel/internal/http/handlers"
)

func SetupRoutes(r *gin.Engine) {
	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")
	{
		// Auth
		api.POST("/login", handlers.Login)

		// Work Orders
		api.GET("/workorders", handlers.GetWorkOrders)
		api.POST("/workorders", handlers.CreateWorkOrder)
		api.GET("/workorders/:id", handlers.GetWorkOrder)
		api.PUT("/workorders/:id", handlers.UpdateWorkOrder)
		api.DELETE("/workorders/:id", handlers.DeleteWorkOrder)

		// Customers
		api.GET("/customers", handlers.GetCustomers)
		api.POST("/customers", handlers.CreateCustomer)
		api.GET("/customers/:id", handlers.GetCustomer)
		api.PUT("/customers/:id", handlers.UpdateCustomer)
		api.DELETE("/customers/:id", handlers.DeleteCustomer)

		// Inventory
		api.GET("/inventory", handlers.GetInventory)
		api.POST("/inventory", handlers.CreateInventory)
		api.PUT("/inventory/:id", handlers.UpdateInventory)

		// Users
		api.GET("/users", handlers.GetUsers)
		api.POST("/users", handlers.CreateUser)
		api.PUT("/users/:id", handlers.UpdateUser)
		api.DELETE("/users/:id", handlers.DeleteUser)

		// Posts
		api.GET("/posts", handlers.GetPosts)
		api.POST("/posts", handlers.CreatePost)
		api.PUT("/posts/:id", handlers.UpdatePost)
		api.DELETE("/posts/:id", handlers.DeletePost)

		// Settings
		api.GET("/settings", handlers.GetSettings)
		api.PUT("/settings", handlers.UpdateSettings)

		// Dashboard Stats
		api.GET("/stats", handlers.GetDashboardStats)
	}
}
