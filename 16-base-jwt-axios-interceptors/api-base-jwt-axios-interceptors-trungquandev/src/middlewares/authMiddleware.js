// Author: TrungQuanDev: https://youtube.com/@trungquandev

import { StatusCodes } from "http-status-codes";
import { JwtProvider } from "~/providers/JwtProvider.js";

// Middleware đảm nhiệm việc quan trọng: lấy và xác thực cái jwt accessToken nhận được từ phía FE gửi lên có hợp lệ hay không
const isAuthorized = async (req, res, next) => {
	//#region [Cách 1: lấy accessToken nằm trong request cookies phía client - withCredentials trong file authorizeAxios và credentials trong CORS]
	const accessTokenFromCookie = req.cookies?.accessToken;

	// console.log("accessTokenFromCookie", accessTokenFromCookie);

	if (!accessTokenFromCookie) {
		res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized ! (Token not found)" });
		return;
	}
	//#endregion

	//#region [Cách 2:  lấy accessToken trong trường hợp phía FE lưu localstorage và gửi lên thông qua header authorization]
	const accessTokenFromHeader = req.headers.authorization.split(" ")[1];

	// console.log("accessTokenFromHeader", accessTokenFromHeader);

	if (!accessTokenFromHeader) {
		res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized ! (Token not found)" });
		return;
	}
	//#endregion

	try {
		// Bước 1: Thực hiện giải mã token xem có hợp lệ hay là không
		const accessTokenDecoded = await JwtProvider.verifyToken(
			accessTokenFromCookie, // dùng token theo cookie
			// accessTokenFromHeader, // dùng token theo localstorage
			"KBgJwUETt4HeVD05WaXXI9V3JnwCVP" //ACCESS_TOKEN_SECRET_SIGNATURE
		);

		console.log("accessTokenDecoded", accessTokenDecoded);

		// Bước 2: Quan trọng : Nếu như token hợp lệ, thì sẽ cần phải lưu thông tin giải mã được vào cái req.jwtDecoded, sử dụng cho các tầng cần xử lý ở phía sau
		req.jwtDecoded = accessTokenDecoded;

		// Bước 3: cho phép request đi tiếp => next()
		next();
	} catch (error) {
		console.log("Error from authMiddleware", error.message);

		// Trường hợp lỗi 01: nếu cái accessToken nó bị hết hạn expired thì mình cần trả về 1 mã lỗi GONE - 410 cho phía FE biết để gọi api refreshToken
		if (error.message?.includes("jwt expired")) {
			res.status(StatusCodes.GONE).json({ message: "Need to refresh token" });
			return;
		}

		// Trường hợp lỗi 02: nếu như cái accessToken nó không hợp lệ do bất kỳ điều gì khác vụ hết hạn thì chúng ta cứ thẳng tay trả về lỗi 401 cho phía FE xử lý logout / hoặc gọi API logout tuỳ trường hợp
		res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized, Please login !" });
	}
};

export const AuthMiddleware = {
	isAuthorized,
};
