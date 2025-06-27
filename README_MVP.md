# LearnTwinChain MVP Frontend

## Tổng quan

MVP Frontend cho LearnTwinChain với 3 đối tượng người dùng chính:
- **Learner**: Học viên sử dụng AI tutor và theo dõi tiến độ học tập
- **Teacher**: Giáo viên quản lý khóa học và theo dõi học viên
- **Employer**: Nhà tuyển dụng đăng tin tuyển dụng và tìm kiếm ứng viên

## Cấu trúc dự án

```
├── pages/
│   ├── RoleSelectionPage.tsx      # Trang chọn role
│   ├── DashboardPage.tsx          # Dashboard cho Learner
│   ├── EmployerDashboardPage.tsx  # Dashboard cho Employer
│   ├── TeacherDashboardPage.tsx   # Dashboard cho Teacher
│   ├── ModulePage.tsx             # Trang module học tập
│   ├── AiTutorPage.tsx            # Trang AI Tutor
│   └── ProfilePage.tsx            # Trang profile
├── components/
│   ├── EmployerJobCard.tsx        # Card hiển thị job posting
│   ├── TeacherCourseCard.tsx      # Card hiển thị khóa học
│   ├── LearnerProgressCard.tsx    # Card hiển thị tiến độ học viên
│   ├── CandidateCard.tsx          # Card hiển thị ứng viên
│   ├── InteractiveDemo.tsx        # Component demo tính năng tương tác
│   ├── Navbar.tsx                 # Navigation bar
│   └── ...                        # Các component khác
└── types.ts                       # Định nghĩa types cho toàn bộ ứng dụng
```

## Tính năng theo từng Role

### 🎓 Learner (Học viên)
- **Dashboard**: Xem tổng quan tiến độ học tập
- **AI Tutor**: Tương tác với AI để được hướng dẫn
- **Modules**: Học các module được cá nhân hóa
- **Profile**: Xem thông tin cá nhân và digital twin

### 👨‍🏫 Teacher (Giáo viên)
- **Dashboard**: Tổng quan về khóa học và học viên
- **Course Management**: 
  - ✅ Tạo khóa học mới với form validation
  - ✅ Chỉnh sửa thông tin khóa học
  - ✅ Xóa khóa học với confirmation
  - ✅ Publish/Unpublish khóa học
- **Learner Tracking**: 
  - ✅ Xem chi tiết tiến độ học viên
  - ✅ Theo dõi skills và knowledge areas
  - ✅ Gửi tin nhắn cho học viên
- **Analytics**: Phân tích hiệu suất khóa học

### 💼 Employer (Nhà tuyển dụng)
- **Dashboard**: Tổng quan về tin tuyển dụng và ứng viên
- **Job Posting Management**:
  - ✅ Tạo job posting mới với form đầy đủ
  - ✅ Chỉnh sửa job posting
  - ✅ Xóa job posting với confirmation
  - ✅ Quản lý requirements và skills
- **Candidate Management**:
  - ✅ Cập nhật trạng thái ứng viên (pending, reviewed, shortlisted, rejected, hired)
  - ✅ Xem chi tiết profile ứng viên
  - ✅ Theo dõi match score và digital twin data
- **Skill Verification**: Xác minh kỹ năng qua digital twin

## Tính năng tương tác đã thêm

### 🎯 **Employer Interactive Features:**
- **Job Posting CRUD**: Create, Read, Update, Delete job postings
- **Form Validation**: Real-time validation với required fields
- **Status Management**: Dropdown để cập nhật candidate status
- **Toast Notifications**: Feedback cho mọi action
- **Modal Forms**: Professional forms cho job creation/editing

### 🎯 **Teacher Interactive Features:**
- **Course CRUD**: Create, Read, Update, Delete courses
- **Publication Control**: Toggle publish/unpublish status
- **Learner Details Modal**: Chi tiết đầy đủ về học viên
- **Progress Tracking**: Visual progress bars và skill indicators
- **Messaging System**: Gửi tin nhắn cho học viên

### 🎯 **UI/UX Enhancements:**
- **Responsive Design**: Hoạt động tốt trên mọi thiết bị
- **Loading States**: Loading spinners cho async operations
- **Confirmation Dialogs**: Xác nhận trước khi xóa
- **Real-time Updates**: UI cập nhật ngay lập tức sau actions
- **Visual Feedback**: Toast notifications và status indicators

## Cách sử dụng

### 1. Khởi chạy ứng dụng
```bash
npm install
npm run dev
```

### 2. Chọn Role
- Truy cập trang chủ `/`
- Chọn role phù hợp (Learner/Teacher/Employer)
- Hệ thống sẽ chuyển hướng đến dashboard tương ứng

### 3. Khám phá tính năng tương tác

#### **Employer Dashboard:**
1. Click "Post New Job" để tạo job posting mới
2. Điền form với validation
3. Edit/Delete job postings hiện có
4. Cập nhật candidate status từ dropdown
5. Xem candidate details

#### **Teacher Dashboard:**
1. Click "Create Course" để tạo khóa học mới
2. Publish/Unpublish courses
3. Edit/Delete courses
4. Click "View Details" trên learner để xem chi tiết
5. Gửi message cho học viên

### 4. Navigation
- Sử dụng dropdown trong navbar để chuyển đổi giữa các role
- Mỗi role có navigation menu riêng biệt

## Mock Data

Ứng dụng sử dụng mock data để demo các tính năng:

### Employer Mock Data
- 5 job postings (3 active)
- 24 candidates với match scores
- Digital twin data cho mỗi candidate
- Skills và knowledge areas

### Teacher Mock Data
- 4 courses (3 published)
- 156 total learners
- Progress tracking data
- Skills và learning behavior

### Learner Mock Data
- Learning modules
- AI tutor conversations
- Progress tracking

## Công nghệ sử dụng

- **React 19** với TypeScript
- **Tailwind CSS** cho styling
- **React Router** cho navigation
- **Heroicons** cho icons
- **React Hot Toast** cho notifications
- **Material-UI** components

## Cấu trúc Types

```typescript
// User roles
enum UserRole {
  LEARNER = 'learner',
  TEACHER = 'teacher',
  EMPLOYER = 'employer'
}

// Digital Twin
interface DigitalTwin {
  learnerDid: string;
  knowledge: KnowledgeArea;
  skills: Skills;
  behavior: LearningBehavior;
  checkpoints: LearningCheckpoint[];
}

// Job Posting
interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  skills: string[];
  // ...
}

// Course
interface Course {
  id: string;
  title: string;
  description: string;
  modules: LearningModule[];
  enrolledLearners: number;
  // ...
}
```

## Tính năng MVP

### ✅ Đã hoàn thành
- [x] Role-based navigation
- [x] Employer dashboard với job management
- [x] Teacher dashboard với course management
- [x] Learner dashboard với progress tracking
- [x] Digital twin integration
- [x] Responsive design
- [x] Mock data cho demo
- [x] **Interactive CRUD operations**
- [x] **Form validation và error handling**
- [x] **Toast notifications**
- [x] **Modal dialogs**
- [x] **Real-time UI updates**
- [x] **Status management**
- [x] **Confirmation dialogs**

### 🚧 Cần phát triển thêm
- [ ] Authentication & Authorization
- [ ] Real API integration
- [ ] Blockchain integration
- [ ] AI Tutor backend
- [ ] File upload functionality
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] Payment integration

## Hướng dẫn phát triển

### Thêm tính năng mới
1. Định nghĩa types trong `types.ts`
2. Tạo component trong `components/`
3. Tạo page trong `pages/`
4. Thêm route trong `App.tsx`
5. Cập nhật navigation nếu cần

### Styling
- Sử dụng Tailwind CSS classes
- Tuân thủ design system có sẵn
- Responsive design cho mobile/tablet/desktop

### State Management
- Sử dụng React hooks (useState, useEffect)
- Context API cho global state
- Local state cho component-specific data

### Interactive Features
- Sử dụng toast notifications cho feedback
- Implement confirmation dialogs cho destructive actions
- Form validation với real-time feedback
- Modal dialogs cho detailed views

## Demo

Để xem demo:
1. Chạy `npm run dev`
2. Truy cập `http://localhost:5173`
3. Chọn role và khám phá các tính năng tương tác:
   - **Employer**: Tạo job, quản lý candidates
   - **Teacher**: Tạo course, theo dõi learners
   - **Learner**: Xem progress và AI tutor

## Liên hệ

Để biết thêm thông tin về dự án, vui lòng liên hệ team phát triển. 