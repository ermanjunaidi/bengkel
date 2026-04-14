package database

import (
	"log"
	"os"

	"github.com/yourusername/bengkel/internal/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	var err error
	
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connection established")

	// Migrate the schema
	err = DB.AutoMigrate(
		&domain.Profile{},
		&domain.Customer{},
		&domain.Inventory{},
		&domain.WorkOrder{},
		&domain.Setting{},
		&domain.Post{},
	)

	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database migration completed")

	// Seed default admin if not exists
	var count int64
	DB.Model(&domain.Profile{}).Where("username = ?", "admin").Count(&count)
	if count == 0 {
		admin := domain.Profile{
			Username: "admin",
			Password: "admin123", // In production use hashed password
			FullName: "Administrator",
			Role:     "admin",
		}
		DB.Create(&admin)
		log.Println("Default admin user created")
	}
}
