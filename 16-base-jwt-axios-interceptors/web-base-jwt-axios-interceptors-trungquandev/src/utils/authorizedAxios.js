// Author: TrungQuanDev: https://youtube.com/@trungquandev
import axios from "axios";
import { toast } from "react-toastify";
import { handleLogoutAPI, refreshTokenAPI } from "~/apis/index.js";

// Khởi tạo một đôi tượng axios mục đích để custom và cấu hình chung cho dự án

let authorizedAxiosInstance = axios.create();

//#region [Thời gian chờ tối đa của 1 request: 10p]
authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10;
//#endregion

//#region [withCrendentials : sẽ cho phép axios tự động đính kèm và gửi cookie trong mỗi req lên BE (phục vụ trường hợp nếu chúng ta lưu JWT tokens (refresh and access) vào trong httpOnly Cookie của trình duyệt)]
authorizedAxiosInstance.defaults.withCredentials = true;
//#endregion

/**
 * Câu hình Interceptors (Bộ đánh chặn giữa mọi request và response)
 */

// Add a request interceptor: Can thiệp vào giữa những request khi gửi API
authorizedAxiosInstance.interceptors.request.use(
	(config) => {
		// Do something before request is sent : làm 1 điều gì đó trước khi request gửi lên server
		// lấy accessToken từ localstorage đính kèm vào header để gửi lên server
		const accessToken = localStorage.getItem("accessToken");

		if (accessToken) {
			// Cần thềm Bearer vì chúng ta nên tuân thủ theo tiêu chuẩn OAuth 2.0 trong việc xác định loại token đang sử dụng
			// Bearer là định nghĩa loại token dành cho việc xác thực và uỷ quyền, tham khảo các loại token khác như:Basic token, Digest token, Oauth token...
			config.headers["Authorization"] = `Bearer ${accessToken}`;
		}

		return config;
	},
	(error) => {
		// Do something with request error
		return Promise.reject(error);
	}
);

//#region [phần này quan trọng]
/**
 * Khởi tạo 1 cái promise cho việc gọi api refresh_token
 * Mục đích tạo promise này để khi nhận yêu cầu refreshToken đầu tiên thì hold lại việc gọi API refresh_token cho tới khi xong xui thì mới retry lại những api bị lỗi trước đó thay vì cứ gọi lại refreshTokenAPI liên tục với mỗi req bị lỗi.
 */
let refreshTokenPromise = null;
//#endregion

// Add a response interceptor: Can thiệp vào giữa nhưng response nhận về từ API
authorizedAxiosInstance.interceptors.response.use(
	(response) => {
		/**
		 * Tất cả những status code nào nằm [TRONG] khoảng 200-299 (Thành công) => sẽ lọt vào đây
		 */

		return response;
	},
	(error) => {
		/**
		 * Tất cả những status code nào nằm [NGOÀI] khoảng 200-299 (Lỗi) => sẽ lọt vào đây
		 */

		//#region [Khu vực quan trọng : xử lý refreshToken tự động]
		// nếu nhận mã 401 từ BE thì gọi API logout
		if (error.response?.status === 401) {
			handleLogoutAPI().then(() => {
				// Nếu trường hợp dùng cookie thì nhớ xoá userInfo trong localstorage
				// đẩy về page login
				location.href = "/login";
			});
		}
		//#endregion

		// nếu nhận mã [410] từ BE, thì sẽ gọi refreshToken để làm mới lại accessToken
		// Đầu tiên lấy được các request API đang bị lỗi thông qua error.config
		const originalRequest = error.config;
		console.log("originalRequest", originalRequest);

		if (error.response?.status === 410 && originalRequest) {
			if (!refreshTokenPromise) {
				// Lấy refreshToken từ localstorage (cho trường hợp localstorage)
				const refreshToken = localStorage.getItem("refreshToken");
				// Gọi API refreshToken
				refreshTokenPromise = refreshTokenAPI(refreshToken)
					.then((res) => {
						const { accessToken } = res.data;

						localStorage.setItem("accessToken", accessToken);

						authorizedAxiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`;

						// Đồng thời lưu ý là accessToken đã được cập nhật lại trong cookie rồi (trường hợp xài cookie)
					})
					.catch((_error) => {
						console.log("refreshTokenAPI _error", _error);
						// Nếu nhận bất kì lỗi nào từ api refreshToken thì logout luôn

						handleLogoutAPI().then(() => {
							// Nếu trường hợp dùng cookie thì nhớ xoá userInfo trong localstorage
							// đẩy về page login

							location.href = "/login";
						});

						return Promise.reject(_error);
					})
					.finally(() => {
						refreshTokenPromise = null;
					});
			}

			return refreshTokenPromise.then(() => {
				// [Bước cực kì quan trọng: return lại axios instance của chúng ta kết hợp cái originalRequest để gọi lại những api ban đầu bị lỗi]
				return authorizedAxiosInstance(originalRequest);
			});
		}

		/**
		 * Xử lý lỗi tập trung phần hiển thị thông báo lỗi trả vè từ mọi API ở đây
		 * console.log error ra sẽ thấy cấu trúc data dẫn đến message lỗi như bên dưới
		 * Dùng toastity để hiển thị bất kể mọi mã lỗi lên màn hình - Ngoại trừ lỗi 410 - GONE - phục vụ việc refreshToken
		 */

		if (error.response?.status !== 410) {
			toast.error(error.response?.data?.message || error?.message);
		}

		return Promise.reject(error);
	}
);

export default authorizedAxiosInstance;
