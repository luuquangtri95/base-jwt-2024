// Author: TrungQuanDev: https://youtube.com/@trungquandev
import { StatusCodes } from "http-status-codes";
import ms from "ms";
import { JwtProvider } from "~/providers/JwtProvider.js";

/**
 * Mock nhanh thông tin user thay vì phải tạo Database rồi query.
 * Nếu muốn học kỹ và chuẩn chỉnh đầy đủ hơn thì xem Playlist này nhé:
 * https://www.youtube.com/playlist?list=PLP6tw4Zpj-RIMgUPYxhLBVCpaBs94D73V
 */
const MOCK_DATABASE = {
	USER: {
		ID: "trungquandev-sample-id-12345678",
		EMAIL: "trungquandev.official@gmail.com",
		PASSWORD: "trungquandev@123",
	},
};

/**
 * 2 cái chữ ký bí mật quan trọng trong dự án. Dành cho JWT - Jsonwebtokens
 * Lưu ý phải lưu vào biến môi trường ENV trong thực tế cho bảo mật.
 * Ở đây mình làm Demo thôi nên mới đặt biến const và giá trị random ngẫu nhiên trong code nhé.
 * Xem thêm về biến môi trường: https://youtu.be/Vgr3MWb7aOw
 */
const ACCESS_TOKEN_SECRET_SIGNATURE = "KBgJwUETt4HeVD05WaXXI9V3JnwCVP";
const REFRESH_TOKEN_SECRET_SIGNATURE = "fcCjhnpeopVn2Hg1jG75MUi62051yL";

const login = async (req, res) => {
	try {
		if (
			req.body.email !== MOCK_DATABASE.USER.EMAIL ||
			req.body.password !== MOCK_DATABASE.USER.PASSWORD
		) {
			res.status(StatusCodes.FORBIDDEN).json({
				message: "Your email or password is incorrect!",
			});
			return;
		}

		// Trường hợp nhập đúng thông tin tài khoản, tạo token và trả về cho phía Client
		// Tạo thông tin payload để đính kèm trong JWT token
		const userInfo = {
			id: MOCK_DATABASE.USER.ID,
			email: MOCK_DATABASE.USER.EMAIL,
		};

		// Tạo 2 loại token, accessToken và refreshToken trả về cho phía FE
		const accessToken = await JwtProvider.generateToken(
			userInfo,
			ACCESS_TOKEN_SECRET_SIGNATURE,
			"5s" // 5s
			// "1h"
		);

		const refreshToken = await JwtProvider.generateToken(
			userInfo,
			REFRESH_TOKEN_SECRET_SIGNATURE,
			"14s"
		);

		/**
		 * Xử lý trường hợp trả về HTTP ONLY COOKIE cho phía trình duyệt
		 * Về cái maxAge và thư viện ms
		 * Đối với maxAge - thời gian sống của cookie thì chúng ta sẽ để tối đa 14 ngày, tuỳ dự án. Lưu ý
		 * Thời gian sống của cookie khác hoàn toàn với thời gian sống của refreshToken. Không nhầm lẫn cái này nhé !!!
		 */

		res.cookie("accessToken", accessToken, {
			httpOny: true,
			secure: true,
			sameSite: "none",
			maxAge: ms("14 days"),
		});

		res.cookie("refreshToken", refreshToken, {
			httpOny: true,
			secure: true,
			sameSite: "none",
			maxAge: ms("14 days"),
		});

		// Trả về thông tin user cũng như sẽ trả về Tokens cho trường hợp phía FE cần lữu Tokens vào localStorage

		res.status(StatusCodes.OK).json({ ...userInfo, accessToken, refreshToken });
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
	}
};

const logout = async (req, res) => {
	try {
		// Xoá cookie - đơn giản là làm ngược lại so với việc gán cookie ở hàm login
		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");

		res.status(StatusCodes.OK).json({ message: "Logout API success!" });
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
	}
};

const refreshToken = async (req, res) => {
	try {
		// Cách 1: Lấy luôn từ Cookie đã đính kèm vào request
		const refreshTokenFromCookie = req.cookies?.refreshToken;
		// Cách 2: Từ localstora phía FE truyền vào body khi gọi API
		const refreshTokenFromBody = req.body?.refreshToken;

		// Verify / giải mã cái refreshToken xem có hợp lệ không
		const refreshTokenDecoded = await JwtProvider.verifyToken(
			// refreshTokenFromCookie, // sử dụng cookie
			refreshTokenFromBody, // sử dụng body lấy từ localstorage
			REFRESH_TOKEN_SECRET_SIGNATURE
		);

		// Đoạn này vì chúng ta chỉ lưu những thông tin unique và cố định user trong token rồi, vì vậy có thể lấy luôn từ decoded ra, tiết kiệm query vào DB để lấy data mới
		const userInfo = {
			id: refreshTokenDecoded.id,
			email: refreshTokenDecoded.email,
		};

		// Tạo acessToken mới
		const accessToken = await JwtProvider.generateToken(
			userInfo,
			ACCESS_TOKEN_SECRET_SIGNATURE,
			"5s" // 5s
			// "1h"
		);

		// Res lại cookie accessToken mới cho trường hợp sử dụng cookie
		res.cookie("accessToken", accessToken, {
			httpOny: true,
			secure: true,
			sameSite: "none",
			maxAge: ms("14 days"),
		});

		// Trả về accessToken mới cho trường hợp FE cần update lại trong localstorage
		res.status(StatusCodes.OK).json({ accessToken });
	} catch (error) {
		console.log(error);

		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Refresh token is failed" });
	}
};

export const userController = {
	login,
	logout,
	refreshToken,
};
