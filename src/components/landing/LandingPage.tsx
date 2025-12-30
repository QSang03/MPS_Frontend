'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import LeadModal from '@/components/landing/LeadModal'

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f6f6f8]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e7ebf3] bg-[#f8f9fc]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-4 sm:px-10">
          <div className="flex items-center gap-4 text-[#0d121b]">
            <div className="text-primary flex size-8 items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#135bec]"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" />
              </svg>
            </div>
            <h2 className="text-xl leading-tight font-bold tracking-[-0.015em] text-[#0d121b]">
              MPS - CHÍNH NHÂN TECHNOLOGY
            </h2>
          </div>
          <div className="hidden flex-1 items-center justify-end gap-8 md:flex">
            <nav className="flex items-center gap-6">
              <a
                className="text-sm font-medium text-[#0d121b] transition-colors hover:text-[#135bec]"
                href="#"
              >
                Trang chủ
              </a>
              <a
                className="text-sm font-medium text-[#0d121b] transition-colors hover:text-[#135bec]"
                href="#problems"
              >
                Vấn đề
              </a>
              <a
                className="text-sm font-medium text-[#0d121b] transition-colors hover:text-[#135bec]"
                href="#solution"
              >
                Giải pháp
              </a>
              <a
                className="text-sm font-medium text-[#0d121b] transition-colors hover:text-[#135bec]"
                href="#contact"
              >
                Liên hệ
              </a>
            </nav>
            <Link
              href={ROUTES.LOGIN}
              className="flex h-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#135bec] px-4 text-sm leading-normal font-bold tracking-[0.015em] text-white transition-colors hover:bg-blue-700"
            >
              <span className="truncate">Đăng nhập</span>
            </Link>
          </div>
          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={ROUTES.LOGIN}
              className="flex h-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#135bec] px-4 text-sm leading-normal font-bold tracking-[0.015em] text-white transition-colors hover:bg-blue-700"
            >
              <span className="truncate">Đăng nhập</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center px-4 py-5 sm:px-10">
        <div className="w-full max-w-[960px]">
          <div
            className="relative flex min-h-[540px] w-full flex-col justify-end overflow-hidden rounded-xl bg-cover bg-center p-6 sm:p-10"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCk4oGCeKsbIG1qw-JfJhrKZUoKoEudShrijBYTMZ9a-LSjGeByViZcMRqcB-XOqlovr653rp-ZydPQGnHJ8FO2Oj4faLlGycHMetwAx2leGkJp7mNdEtDQp-67QkO8xgdJeLyv6y3gfFixpo5C455a8jezI01qKSI9JbpFHfVXYAyojSZEegbBh2iwCQ8JNM7z__gn5_hWyhFGwNLqy3woKcqnm5p6k3TdTVLmZkOWnyGuea0dNlMFQDMnty1NsI6O3qjzd8FJSU7A")`,
            }}
          >
            <div className="relative z-10 flex max-w-2xl flex-col gap-6">
              {/* Headline */}
              <h1 className="text-4xl leading-tight font-black tracking-[-0.02em] text-white sm:text-5xl">
                Quản lý in ấn trọn gói – Không lo mực, không lo hỏng máy
              </h1>
              {/* Sub-headline */}
              <p className="text-lg leading-normal font-medium text-white/90">
                Giảm đến 30% chi phí in ấn. Trả tiền theo số trang in thực tế.
              </p>
              {/* Benefits List */}
              <ul className="flex flex-col gap-3 text-base font-normal text-white/90">
                <li className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-400"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Thuê máy – Bảo trì – Mực in – Linh kiện</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-400"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Giám sát từ xa – Hỗ trợ nhanh</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-400"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Chi phí minh bạch mỗi tháng</span>
                </li>
              </ul>
              {/* CTA Button */}
              <div className="pt-4">
                <LeadModal>
                  <button className="flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-[#135bec] px-8 text-base leading-normal font-bold tracking-[0.015em] text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto">
                    <span>Nhận tư vấn &amp; báo giá MPS miễn phí</span>
                  </button>
                </LeadModal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="flex flex-col items-center px-4 py-10 sm:px-10" id="problems">
        <div className="flex w-full max-w-[960px] flex-col gap-10">
          {/* Section Header */}
          <div className="text-center sm:text-left">
            <span className="mb-2 block text-sm font-bold tracking-wider text-[#135bec] uppercase">
              MPS GIẢI QUYẾT ĐIỀU GÌ CHO BẠN?
            </span>
            <h2 className="text-3xl leading-tight font-bold text-[#0d121b] sm:text-4xl">
              Bạn đang gặp những vấn đề này?
            </h2>
          </div>

          {/* Problem Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#e7ebf3] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <h3 className="text-lg leading-tight font-bold text-[#0d121b]">Máy in hay hỏng</h3>
              <p className="text-sm leading-relaxed font-normal text-[#4c669a]">
                Máy móc trục trặc thường xuyên gây gián đoạn quy trình làm việc và ảnh hưởng tiến
                độ.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#e7ebf3] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 text-orange-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                </svg>
              </div>
              <h3 className="text-lg leading-tight font-bold text-[#0d121b]">Hết mực đột xuất</h3>
              <p className="text-sm leading-relaxed font-normal text-[#4c669a]">
                Phải gọi nhiều nhà cung cấp khác nhau, chờ đợi lâu để được thay mực mới.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#e7ebf3] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 text-yellow-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" x2="12" y1="2" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-lg leading-tight font-bold text-[#0d121b]">
                Chi phí không kiểm soát
              </h3>
              <p className="text-sm leading-relaxed font-normal text-[#4c669a]">
                Không biết chính xác chi phí mỗi trang in là bao nhiêu, gây lãng phí ngân sách.
              </p>
            </div>

            {/* Card 4 */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#e7ebf3] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 text-purple-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h3 className="text-lg leading-tight font-bold text-[#0d121b]">IT quá tải</h3>
              <p className="text-sm leading-relaxed font-normal text-[#4c669a]">
                Nhân viên IT mất quá nhiều thời gian xử lý các sự cố máy in thay vì việc chính.
              </p>
            </div>

            {/* Card 5 */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#e7ebf3] bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-2">
              <div className="mb-2 text-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="8" x="5" y="2" rx="2" />
                  <rect width="20" height="8" x="2" y="14" rx="2" />
                  <path d="M6 18h2" />
                  <path d="M12 18h6" />
                </svg>
              </div>
              <h3 className="text-lg leading-tight font-bold text-[#0d121b]">
                Thiết bị không đồng bộ
              </h3>
              <p className="text-sm leading-relaxed font-normal text-[#4c669a]">
                Mỗi phòng ban dùng một loại máy, một hãng khác nhau khiến việc quản lý trở nên phức
                tạp và khó khăn.
              </p>
            </div>
          </div>

          {/* Solution Statement */}
          <div
            className="mt-4 rounded-xl border border-[#135bec]/20 bg-[#135bec]/10 p-8 text-center"
            id="solution"
          >
            <p className="text-xl leading-tight font-bold text-[#135bec] sm:text-2xl">
              MPS xử lý tất cả trong một dịch vụ duy nhất
            </p>
          </div>
        </div>
      </section>

      {/* Key Takeaway Section */}
      <section className="flex flex-col items-center bg-white px-4 py-12 sm:px-10">
        <div className="flex w-full max-w-[960px] flex-col items-center gap-8 text-center">
          <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#101622] to-[#1e293b] p-8 shadow-xl sm:p-12">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-[#135bec]/20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-[#135bec]/10 blur-3xl"></div>

            <h2 className="relative z-10 text-2xl leading-relaxed font-bold text-white sm:text-3xl md:text-4xl">
              &quot;MPS = In bao nhiêu, trả bấy nhiêu <br className="hidden sm:block" />
              <span className="text-blue-400">Không lo mực</span> –{' '}
              <span className="text-blue-400">Không lo sửa</span> –{' '}
              <span className="text-blue-400">Không gián đoạn</span>&quot;
            </h2>
          </div>

          <Link
            href={ROUTES.LOGIN}
            className="mt-4 flex h-12 min-w-[200px] cursor-pointer items-center justify-center rounded-lg bg-[#135bec] px-6 text-base font-bold text-white shadow-lg transition-colors hover:bg-blue-700"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="flex flex-col items-center px-4 py-12 sm:px-10" id="contact">
        <div className="flex w-full max-w-[960px] flex-col items-center gap-6 text-center">
          <h2 className="text-3xl leading-tight font-bold text-[#0d121b] sm:text-4xl">
            Liên hệ tư vấn
          </h2>
          <p className="max-w-xl text-lg text-[#4c669a]">
            Để lại thông tin để nhận tư vấn miễn phí về giải pháp quản lý in ấn phù hợp với doanh
            nghiệp của bạn.
          </p>
          <LeadModal>
            <button className="flex h-12 min-w-[200px] cursor-pointer items-center justify-center rounded-lg bg-[#135bec] px-6 text-base font-bold text-white shadow-lg transition-colors hover:bg-blue-700">
              Nhận tư vấn &amp; báo giá MPS miễn phí
            </button>
          </LeadModal>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#e7ebf3] bg-[#f8f9fc] py-12">
        <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center text-[#135bec]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#0d121b]">MPS Services</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <a
                className="text-sm font-medium text-[#4c669a] transition-colors hover:text-[#135bec]"
                href="#"
              >
                Trang chủ
              </a>
              <a
                className="text-sm font-medium text-[#4c669a] transition-colors hover:text-[#135bec]"
                href="#problems"
              >
                Dịch vụ
              </a>
              <a
                className="text-sm font-medium text-[#4c669a] transition-colors hover:text-[#135bec]"
                href="#contact"
              >
                Báo giá
              </a>
              <a
                className="text-sm font-medium text-[#4c669a] transition-colors hover:text-[#135bec]"
                href="#contact"
              >
                Liên hệ
              </a>
            </div>
          </div>
          <div className="border-t border-[#e7ebf3]"></div>
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-sm text-[#9aaac8]">© 2024 MPS Services. All rights reserved.</p>
            <div className="flex gap-4">
              <a className="text-[#9aaac8] hover:text-[#135bec]" href="#">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
              <a className="text-[#9aaac8] hover:text-[#135bec]" href="#">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
