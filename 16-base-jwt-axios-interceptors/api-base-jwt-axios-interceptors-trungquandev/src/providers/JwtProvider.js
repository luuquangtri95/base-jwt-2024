// Author: TrungQuanDev: https://youtube.com/@trungquandev
import JWT from "jsonwebtoken";

/**
 * Function tạo mới một token - Cần 3 tham số đầu vào
 * UserInfo : Những thông tin muốn đính kèm vào token
 * secretSignature: Chữ ký bí mật (dạng 1 chuỗi string ngẫu nhiên) trên docs thì để tên là privateKey tuỳ đều được
 * TokenLife: thời gian sống của token
 */
const generateToken = async (userInfo, secretSignature, tokenLife) => {
	try {
		// Hàm sign() của thư viện jwt - thuật toán mặc định là HS256, cứ cho vào code để nhớ

		return JWT.sign(userInfo, secretSignature, { algorithm: "HS256", expiresIn: tokenLife });
	} catch (error) {
		throw new Error(error);
	}
};

/**
 * Function kiểm tra một token có hợp lệ hay không
 * Hợp lệ ở đây hiểu đơn giản là cái token được tạo ra có đúng với cái chữ ký bí mật secretSignature trong dự án hay không
 */
const verifyToken = async (token, secretSignature) => {
	try {
		// Hàm verify của thư viện jwt
		return JWT.verify(token, secretSignature);
	} catch (error) {
		throw new Error(error);
	}
};

export const JwtProvider = {
	generateToken,
	verifyToken,
};
