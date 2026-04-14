package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/bengkel/internal/database"
	"github.com/yourusername/bengkel/internal/domain"
)

func GetWorkOrders(c *gin.Context) {
	var wos []domain.WorkOrder
	query := database.DB.Preload("Customer").Preload("Technician")

	search := c.Query("search")
	if search != "" {
		query = query.Joins("JOIN customers ON customers.id = work_orders.customer_id").
			Where("complaint LIKE ? OR customers.name LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Order("created_at desc").Find(&wos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": wos})
}

func CreateWorkOrder(c *gin.Context) {
	var wo domain.WorkOrder
	if err := c.ShouldBindJSON(&wo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&wo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": wo})
}

func GetWorkOrder(c *gin.Context) {
	id := c.Param("id")
	var wo domain.WorkOrder
	if err := database.DB.Preload("Customer").Preload("Technician").First(&wo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": wo})
}

func UpdateWorkOrder(c *gin.Context) {
	id := c.Param("id")
	var wo domain.WorkOrder
	if err := database.DB.First(&wo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work order not found"})
		return
	}

	if err := c.ShouldBindJSON(&wo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Save(&wo)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": wo})
}

func DeleteWorkOrder(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&domain.WorkOrder{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Work order deleted"})
}

func GetDashboardStats(c *gin.Context) {
	var totalOrders int64
	var pendingOrders int64
	var processedOrders int64
	var totalRevenue float64

	database.DB.Model(&domain.WorkOrder{}).Count(&totalOrders)
	database.DB.Model(&domain.WorkOrder{}).Where("status = ?", "Menunggu").Count(&pendingOrders)
	database.DB.Model(&domain.WorkOrder{}).Where("status = ?", "Diproses").Count(&processedOrders)
	database.DB.Model(&domain.WorkOrder{}).Select("COALESCE(SUM(total_cost), 0)").Row().Scan(&totalRevenue)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_orders":    totalOrders,
			"pending_orders":   pendingOrders,
			"processed_orders": processedOrders,
			"total_revenue":    totalRevenue,
		},
	})
}

// Basic Customer Handlers (can be moved to separate file)
func GetCustomers(c *gin.Context) {
	var customers []domain.Customer
	if err := database.DB.Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": customers})
}

func CreateCustomer(c *gin.Context) {
	var customer domain.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&customer)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": customer})
}

func GetCustomer(c *gin.Context) {
	id := c.Param("id")
	var customer domain.Customer
	if err := database.DB.First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": customer})
}

func UpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	var customer domain.Customer
	if err := database.DB.First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}
	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&customer)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": customer})
}

func DeleteCustomer(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&domain.Customer{}, id)
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// Basic Inventory Handlers
func GetInventory(c *gin.Context) {
	var items []domain.Inventory
	if err := database.DB.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

func CreateInventory(c *gin.Context) {
	var item domain.Inventory
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&item)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": item})
}

func UpdateInventory(c *gin.Context) {
	id := c.Param("id")
	var item domain.Inventory
	if err := database.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&item)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": item})
}

// User Management Handlers
func GetUsers(c *gin.Context) {
	var users []domain.Profile
	database.DB.Find(&users)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": users})
}

func CreateUser(c *gin.Context) {
	var user domain.Profile
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": user})
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user domain.Profile
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": user})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&domain.Profile{}, "id = ?", id)
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// Post Management Handlers
func GetPosts(c *gin.Context) {
	var posts []domain.Post
	database.DB.Preload("Author").Find(&posts)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": posts})
}

func CreatePost(c *gin.Context) {
	var post domain.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&post)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": post})
}

func UpdatePost(c *gin.Context) {
	id := c.Param("id")
	var post domain.Post
	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&post)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": post})
}

func DeletePost(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&domain.Post{}, id)
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// Setting Handlers
func GetSettings(c *gin.Context) {
	var settings []domain.Setting
	database.DB.Find(&settings)
	settingsMap := make(map[string]string)
	for _, s := range settings {
		settingsMap[s.Key] = s.Value
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": settingsMap})
}

func UpdateSettings(c *gin.Context) {
	var settings map[string]string
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	for k, v := range settings {
		database.DB.Save(&domain.Setting{Key: k, Value: v})
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
