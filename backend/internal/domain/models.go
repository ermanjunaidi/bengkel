package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Profile struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Username  string         `gorm:"unique;not null" json:"username"`
	Password  string         `gorm:"not null" json:"-"`
	FullName  string         `gorm:"not null" json:"full_name"`
	Role      string         `gorm:"not null" json:"role"` // admin, supervisor, teknisi, kasir
	Phone     string         `json:"phone"`
}

func (p *Profile) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return
}

type Customer struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Name      string         `gorm:"not null" json:"name"`
	Phone     string         `gorm:"not null" json:"phone"`
	Address   string         `json:"address"`
}

type Inventory struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	PartCode  string         `gorm:"unique" json:"part_code"`
	Name      string         `gorm:"not null" json:"name"`
	Category  string         `json:"category"`
	Stock     int            `gorm:"default:0" json:"stock"`
	MinStock  int            `gorm:"default:5" json:"min_stock"`
	BuyPrice  float64        `json:"buy_price"`
	SellPrice float64        `json:"sell_price"`
}

type WorkOrder struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	DateIn       time.Time      `json:"date_in"`
	CustomerID   uint           `json:"customer_id"`
	Customer     Customer       `gorm:"foreignKey:CustomerID" json:"customer"`
	Complaint    string         `json:"complaint"`
	Spareparts   string         `json:"spareparts"` // Detailed list of spareparts used
	Status       string         `gorm:"default:'Menunggu'" json:"status"` // Menunggu, Diproses, Selesai, Diambil, Dibatalkan
	TotalCost    float64        `json:"total_cost"`
	TechnicianID *uuid.UUID     `gorm:"type:uuid" json:"technician_id"`
	Technician   *Profile       `gorm:"foreignKey:TechnicianID" json:"technician"`
	EstimateDate *time.Time     `json:"estimate_date"`
	PaymentStatus string        `gorm:"default:'Belum Lunas'" json:"payment_status"` // Belum Lunas, DP 50%, Lunas
	Notes        string         `json:"notes"`
}

type Setting struct {
	Key   string `gorm:"primaryKey" json:"key"`
	Value string `json:"value"`
}

type Post struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Title     string         `gorm:"not null" json:"title"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	ImageUrl  string         `json:"image_url"`
	IsPublic  bool           `gorm:"default:true" json:"is_public"`
	AuthorID  uuid.UUID      `gorm:"type:uuid" json:"author_id"`
	Author    Profile        `gorm:"foreignKey:AuthorID" json:"author"`
}
