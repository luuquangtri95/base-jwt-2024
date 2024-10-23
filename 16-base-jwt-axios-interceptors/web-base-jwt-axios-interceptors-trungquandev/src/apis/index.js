import authorizedAxiosInstance from "~/utils/authorizedAxios.js";
import { API_ROOT } from "~/utils/constants.js";

export const handleLogoutAPI = async () => {
	// Với trường hợp sử dụng localStorage: chỉ cần xoá thông tin user trong localstorage phía frontend
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	localStorage.removeItem("userInfo");

	// Vởi trường hợp sử dụng cookie: Dùng httpOnly cookies => gọi API để xử lý remove Cookies
	return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`);
};

export const refreshTokenAPI = async (refreshToken) => {
	return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/refresh_token`, {
		refreshToken,
	});
};
