# Fabric Inventory Management System

A comprehensive fabric inventory management system with chat functionality and data analysis capabilities. This application helps businesses track, manage, and analyze their fabric inventory efficiently.

## Features

### 📦 Inventory Management
- **Complete CRUD Operations**: Add, view, edit, and delete fabric records
- **Rich Fabric Information**: Track name, type, color, pattern, quantity, price, supplier, and descriptions
- **Image Support**: Upload and display fabric images
- **Real-time Stock Tracking**: Monitor current inventory levels with automatic calculations

### 🔍 Search & Filtering
- **Advanced Search**: Search fabrics by name or description
- **Multi-criteria Filtering**: Filter by fabric type, color, and supplier
- **Active Filter Display**: See currently applied filters with easy clearing

### 📊 Data Analytics
- **Dashboard Overview**: Key metrics including total fabrics, inventory value, and low stock alerts
- **Visual Charts**: Pie charts for fabric type distribution and bar charts for supplier performance
- **Low Stock Monitoring**: Automatic identification of items needing restocking
- **Insights Panel**: Actionable business intelligence

### 💬 Chat Assistant
- **Interactive Help**: AI-powered chat interface for user assistance
- **Quick Actions**: Pre-defined questions for common tasks
- **Contextual Responses**: Smart responses related to inventory management
- **Chat History**: Persistent conversation tracking

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Tailwind CSS**: Modern, clean, and professional styling
- **Heroicons**: Beautiful and consistent iconography
- **Interactive Elements**: Smooth transitions and hover effects

## Technology Stack

### Backend
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **SQLite**: Lightweight database for data persistence
- **Multer**: File upload handling for fabric images

### Frontend
- **React**: Modern JavaScript library for user interfaces
- **Axios**: HTTP client for API communication
- **Chart.js**: Data visualization and analytics charts
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Professional icon library

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fabric-inventory-management
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Start the application**
   
   **Start the backend server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`

   **Start the frontend client (in a new terminal):**
   ```bash
   cd client
   npm start
   ```
   The client will run on `http://localhost:3001`

## Usage

### Adding Fabrics
1. Click the "Add Fabric" button in the Inventory tab
2. Fill in fabric details including name, type, color, quantity, and price
3. Optionally add an image and description
4. Click "Add Fabric" to save

### Managing Inventory
- **View**: Browse all fabrics in the inventory list
- **Edit**: Click the pencil icon to modify fabric details
- **Delete**: Click the trash icon to remove fabrics (with confirmation)
- **Search**: Use the search bar to find specific fabrics
- **Filter**: Apply filters by type, color, or supplier

### Analytics
- Navigate to the Analytics tab to view:
  - Summary cards with key metrics
  - Fabric type distribution chart
  - Top suppliers chart
  - Low stock alerts
  - Business insights

### Chat Assistant
- Access the Chat Assistant tab for help with:
  - Inventory management questions
  - Adding and updating fabrics
  - Understanding analytics
  - General application guidance

## Database Schema

### Fabrics Table
- `id`: Primary key
- `name`: Fabric name
- `type`: Fabric type (cotton, silk, wool, etc.)
- `color`: Fabric color
- `pattern`: Fabric pattern (optional)
- `quantity`: Initial quantity
- `unit`: Unit of measurement (meters, yards, etc.)
- `price_per_unit`: Cost per unit
- `supplier`: Supplier name
- `description`: Additional details
- `image_url`: Path to uploaded image
- `date_added`: Creation timestamp
- `last_updated`: Last modification timestamp

### Inventory Transactions Table
- `id`: Primary key
- `fabric_id`: Foreign key to fabrics
- `transaction_type`: 'in' or 'out'
- `quantity`: Transaction quantity
- `unit_price`: Price per unit at time of transaction
- `total_value`: Total transaction value
- `reference`: Transaction reference
- `date`: Transaction timestamp

### Chat Messages Table
- `id`: Primary key
- `user_message`: User's message
- `bot_response`: Bot's response
- `timestamp`: Message timestamp
- `session_id`: Chat session identifier

## API Endpoints

### Fabrics
- `GET /api/fabrics` - Get all fabrics
- `POST /api/fabrics` - Add new fabric
- `PUT /api/fabrics/:id` - Update fabric
- `DELETE /api/fabrics/:id` - Delete fabric
- `GET /api/fabrics/search` - Search fabrics with filters

### Analytics
- `GET /api/analytics` - Get inventory analytics data

### Chat
- `POST /api/chat` - Send chat message
- `GET /api/chat/history/:session_id` - Get chat history

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Fabric Inventory Management System** - Streamlining fabric inventory with modern technology and intelligent insights.
