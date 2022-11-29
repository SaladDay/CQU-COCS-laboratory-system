var app = getApp();
const CryptoJS = require('../utils/crypto-js');
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

    /**
     * 页面的初始数据
     */
    data: {
        captchaImg: '',
        password_eys :true,
        eys_icon:'closed-eye'
    },

    showPassword:function(e){
        var password_eys = this.data.password_eys;
        var eys_icon = this.data.eys_icon;
        if(password_eys){
            password_eys = false;
            eys_icon = 'eye';
        }else{
            password_eys = true;
            eys_icon = 'closed-eye';
        }
        this.setData({
            password_eys:password_eys,
            eys_icon:eys_icon
        });
        console.log(e)
    },


    requestLoginSaltInfo: async function (e) {

        var cookies = this.data.cookies;
        var data = {
            type: 'loginManage',
            opt: "requestLoginSalt",
            cookies: cookies
        }

        var resp = await app.requestCloud(data);
        var loginSaltInfo = resp.result;
        console.log(loginSaltInfo)
        var cookies = loginSaltInfo.cookies;
        // delete loginSaltInfo.cookies;
        this.setData({
            cookies: cookies,
            loginSaltInfo: loginSaltInfo
        });
        
        console.log(this.data)
    },

    async onCertificationSubmit() {
        console.log("onCertificationSubmit")
        // await this.requestLoginSaltInfo();
        
        var username = this.data.username;
        var password = this.data.password;
        var croypto = this.data.loginSaltInfo.croypto;
        // password = this.encryptAES(password, croypto);
        password = this.desEncrypt(croypto,password);

        var captchaImgStr = this.data.captchaImgStr;
        var cookies = this.data.cookies;

        var loginSaltInfo = this.data.loginSaltInfo;
        loginSaltInfo.username = username;
        loginSaltInfo.password = password;

        if (!captchaImgStr) {
            captchaImgStr = '';
        }
        loginSaltInfo.captcha_code = captchaImgStr;
        if (!cookies) {
            cookies = [];
        }
        loginSaltInfo.cookies = cookies;

        wx.showLoading({
            title: '',
        });
        var data = {
            type: 'loginManage',
            opt: 'requestLogin',
            loginInfo: loginSaltInfo
        }
        var resp = await app.requestCloud(data);
        wx.hideLoading();
        var result = resp.result;

        if (!result.success) {

            var type = result.type;
            if (type === 'error') {
                Dialog.alert({
                    message: result.errMsg,
                }).then(() => {
                    // on confirm
                }).catch(() => {
                    // on cancel
                });
               
            } else {
                var captchaImg = result.errMsg;
                console.log(captchaImg)
                this.setData({
                    captchaImg: captchaImg,
                    cookies: result.cookies
                });
            }
        } else {
            var nextUrl = this.data.nextUrl;
            console.log(this.data)
            console.log(nextUrl)
            wx.navigateTo({
                url: nextUrl,
            })
        }
    },

    desEncrypt(croypto, password) {
		const n = CryptoJS.enc.Base64.parse(croypto);
		return CryptoJS.DES.encrypt(password, n, {
			mode: CryptoJS.mode.ECB,
			padding: CryptoJS.pad.Pkcs7
		}).toString()
	},

    //AES-128-CBC加密模式，key需要为16位，key和iv可以一样
    getAesString: function (data, key0, iv0) { //加密
        key0 = key0.replace(/(^\s+)|(\s+$)/g, "");
        var key = CryptoJS.enc.Utf8.parse(key0);
        var iv = CryptoJS.enc.Utf8.parse(iv0);
        var encrypted = CryptoJS.AES.encrypt(data, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString(); //返回的是base64格式的密文
    },

    encryptAES: function (data, aesKey) { //加密
        if (!aesKey) {
            return data;
        }
        var encrypted = this.getAesString(this.randomString(64) + data, aesKey, this.randomString(16)); //密文
        return encrypted;
    },

    randomString: function (len) {
        var $aes_chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'; /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        var aes_chars_len = $aes_chars.length;
        var retStr = '';
        for (var i = 0; i < len; i++) {
            retStr += $aes_chars.charAt(Math.floor(Math.random() * aes_chars_len));
        }
        return retStr;
    },
    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad(options) {
        console.log("login onLoad...")
        var nextUrl = options.nextUrl;
        console.log(options)
        console.log(nextUrl)
        this.setData({
            nextUrl: nextUrl
        })

        var data = {
            type: 'loginManage',
            opt: 'requestPreUrl'
        }
        var resp = await app.requestCloud(data);
        console.log(resp)
        var cookies = resp.result;
        this.setData({
            cookies: cookies
        });
        await this.requestLoginSaltInfo();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})