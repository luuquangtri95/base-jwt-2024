// Author: TrungQuanDev: https://youtube.com/@trungquandev
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "~/pages/Login";
import Dashboard from "~/pages/Dashboard";

/**
 * Giải pháp clean code trong việc xác định các route nào cần đăng nhập tài khoản xong thì mới cho truy cập
 * Sử dụng <Outlet /> của react router dom để hiển thị các child route
 */
const ProtectedRoutes = () => {
	const user = JSON.parse(localStorage.getItem("userInfo"));

	if (!user) {
		return (
			<Navigate
				to="/login"
				replace={true}
			/>
		);
	}

	return <Outlet />;
};

const UnauthorizedRoutes = () => {
	const user = JSON.parse(localStorage.getItem("userInfo"));

	if (user) {
		return (
			<Navigate
				to="/dashboard"
				replace={true}
			/>
		);
	}

	return <Outlet />;
};

function App() {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<Navigate
						to="/login"
						replace={true}
					/>
				}
			/>

			<Route element={<UnauthorizedRoutes />}>
				<Route
					path="/login"
					element={<Login />}
				/>
			</Route>

			<Route element={<ProtectedRoutes />}>
				{/* <Outlet /> của react-router-dom sẽ chạy vào các child route trong này*/}
				<Route
					path="/dashboard"
					element={<Dashboard />}
				/>
				{/* sau này sẽ còn nhiều route nữa ở dưới này */}
			</Route>
		</Routes>
	);
}

export default App;
