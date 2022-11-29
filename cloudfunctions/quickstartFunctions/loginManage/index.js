
const request = require('request');
const cheerio = require('cheerio');
const userManage = require('./../userManage/index');
const entityManage = require('./../entityManage/index');
const axios = require('axios');
const qs = require('qs');


const {
    utils,
    getLogger
} = require("xmcommon");
var urlTool = require('url');
const log = getLogger(__filename);
const CryptoJS = require('crypto-js');
const {
    SSL_OP_NO_QUERY_MTU
} = require('constants');


const cloud = require('wx-server-sdk');
const { text } = require('cheerio/lib/api/manipulation');
cloud.init({
    env: "cloud1-4gahuybndcca4024"
});
const wxContext = cloud.getWXContext();
const openId = wxContext.OPENID;
const db = cloud.database();
const _ = db.command;

// 获取openId云函数入口函数
exports.main = async (event, context) => {

    try {
        const opt = event.opt;
        let result = null;
        switch (opt) {
            case 'requestPreUrl':
                return await requestPreUrl();

            case 'requestLoginSalt':
                let cookies = event.cookies;
                return requestLoginSalt(cookies);

            case 'requestIsNeedCaptchaImg':
                let username = event.username;
                let needCaptchaImg = await requestIsNeedCaptchaImg(username, event.cookies);
                if(needCaptchaImg){
                    result = await requestCaptchaImg(event.cookies);
                    return {
                            success: true,
                            type: 'captchaImg',
                            errMsg: result.content
                    };
                }
                return {
                        success: true,
                        type: 'needCaptchaImg',
                        errMsg: needCaptchaImg,
                };
            case 'getCaptchaImg':
                result = await requestCaptchaImg(event.cookies);
                return {
                        success: true,
                        type: 'captchaImg',
                        errMsg: result.content
                };
            
            case 'requestLogin':
                var loginInfo = event.loginInfo;
                result = await requestLogin(loginInfo);
                const type = result.type;

                if (type === 'error') {
                    return {
                        success: false,
                        type: 'error',
                        errMsg: result.content
                    };
                } else if (type === 'success') {
                    const wxContext = cloud.getWXContext();
                    const openId = wxContext.OPENID;
                    let user = result.user;
                    user.openId = openId;
                    let username = user.username;
                    let where = {username:username};
                    result = await entityManage.findbyWhere("users", where);
                    if(result && result.data && result.data.length > 0){
                        let data = result.data;
                        let dbUser = data[0];
                        let userType = dbUser.userType;
                        Object.assign(dbUser,user);
                        if(userType === 0){
                            dbUser.userType = userType;
                        }
                        await entityManage.update("users", dbUser);
                    }else{
                        await entityManage.add("users", user);
                    }
                    console.log(user)
                    return {
                        success: true
                    };
                }
        }

    } catch (e) {
        return {
            success: false,
            errMsg: "网络异常或学校网站改版！"
        };
    }
};


async function requestPreUrl() {

    let url = "http://authserver.cqu.edu.cn/authserver/login?service=http%3A%2F%2Fi.cqu.edu.cn%2Flogin%3Fservice%3Dhttp%3A%2F%2Fi.cqu.edu.cn%2Fnew%2Findex.html";
    let options = {
        headers: {
            'Host': 'authserver.cqu.edu.cn',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Referer': 'http://i.cqu.edu.cn/',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cookie': 'org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE=zh_CN'
        },
        followRedirect: false,
    }

    let result = await get(url, options);
    let cookies = {};
    let cookieList = result.response['headers']['set-cookie'];
    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }
    return cookies
}

/**
 * 获取登录页盐值
 */
async function requestLoginSalt() {
    
    /**
     * 封装用户登录信息，包括根据登录页面salt值对密码加密，因此需要先get登录页面解析并获取盐值。
     */
    let cookies = {};

    let url = "https://sso.cqu.edu.cn/login";
    let options = {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            "Cache-Control": "max-age=0",
            "Connection": "keep-alive",
            "Host": "sso.cqu.edu.cn",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
        },
    }
    let result = await get(url, options)

    /**
     * cookie管理
     */
    cookieList = result.response['headers']['set-cookie'];
    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }

    const htmlString = result.body;
    let $ = cheerio.load(htmlString, {
        decodeEntities: false
    });
    let croypto = $('#login-croypto').text();
    let execution = $('#login-page-flowkey').text();
    let captchaUrl = $('#captcha-url').text();
    let captchaImg = "";
    if(captchaUrl !== ""){
        captchaImg = await requestCaptchaImg(cookies);
    }
    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }
    let userInfo = {
        croypto: croypto,
        execution: execution,
        cookies: cookies,
        type: "UsernamePassword",
        _eventId: "submit",
        geolocation: "",
        captchaImg: captchaImg
    }
    
    return userInfo;
}

/**
 * 获取验证码图片
 * 
 * @param {Object} cookies 
 */
async function requestCaptchaImg(cookies) {
    let cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }
    let url = 'https://sso.cqu.edu.cn/api/captcha/generate/DEFAULT';

    let options = {
        encoding: null,
        headers: {
            // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Connection": "keep-alive",
            "Host": "sso.cqu.edu.cn",
            "Referer": "https://sso.cqu.edu.cn/login",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Sec-Fetch-Dest": "image",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent":" Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Cookie": cookieList.join("; ")
        },
    }
    let result = await get(url, options);
    var imgBase64 = "data:image/jpeg;base64," + result.body.toString('base64');
    return {
        type: 'captchaImg',
        content: imgBase64,
        cookies: cookies
    }
}

/**
 * 判断是否需要验证码
 * @param {*} username 
 * @param {*} cookies 
 */
async function requestIsNeedCaptchaImg(username, cookies) {
    /**
     * 将cookies转化为=链接的数组，为了组装成cookies字符串发生到后端
     */
    let cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    let url = 'http://authserver.cqu.edu.cn/authserver/needCaptcha.html?username=' + username + '&pwdEncrypt2=pwdEncryptSalt'
    let options = {
        headers: {
            // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Host": "authserver.cqu.edu.cn",
            "Connection": "keep-alive",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Accept": "text/plain, */*; q=0.01",
            "X-Requested-With": " XMLHttpRequest",
            "Accept-Encoding": " gzip, deflate",
            "Accept-Language": " zh-CN,zh;q=0.9",
            "Referer": "http://authserver.cqu.edu.cn/authserver/login?service=http%3A%2F%2Fmy.cqu.edu.cn%2Fauthserver%2Fauthentication%2Fcas",
            "Cookie": cookieList.join("; ")
        },
    }
    let result = await get(url, options);
    let body = result.body;
    return body === "true";
}


async function requestLogin(loginSaltInfo) {
    let cookies = loginSaltInfo.cookies;
    let userInfo = {
        username: loginSaltInfo.username,
        password: loginSaltInfo.password,
        croypto:loginSaltInfo.croypto,
        captcha_code: loginSaltInfo.captcha_code,
        execution: loginSaltInfo.execution,
        type: loginSaltInfo.type,
        _eventId: loginSaltInfo._eventId,
        geolocation: loginSaltInfo.geolocation
    }
    firstSession = cookies["SESSION"];
    /**
     * 将cookies转化为=链接的数组，为了组装成cookies字符串发生到后端
     */
    let cookieList = [];
    cookieList.push("SESSION" + "=" + cookies["SESSION"]);
    let url = 'https://sso.cqu.edu.cn/login';
    let options = {
        method: 'POST',
        form: userInfo,
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Cache-Control": "max-age=0",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Host": "sso.cqu.edu.cn",
            "Origin": "https://sso.cqu.edu.cn",
            "Referer": "https://sso.cqu.edu.cn/login",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Cookie": cookieList.join("; ")
        },
        followRedirect: true
    }

    let result = await post(url, options);
    let statusCode = result.response.statusCode;
    if(statusCode === 302){
        cookieList = result.response['headers']['set-cookie'];
        if (cookieList) {
            for (let i = 0; i < cookieList.length; i++) {
                const cookieStr = cookieList[i];
                const cookieMap = cookieStr.split(";")[0].split("=");
                cookies[cookieMap[0]] = cookieMap[1];
            }
        }
        secondSession = cookies["SESSION"];
        cookieList = [];
        for (let key in cookies) {
            cookieList.push(key + "=" + cookies[key]);
        }
        //https://self.cqu.edu.cn/cas-success
        let location = result.response['headers']['location'];
        options = {
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                "Cache-Control": "max-age=0",
                "Connection": "keep-alive",
                "Host": "self.cqu.edu.cn",
                "Referer": "https://sso.cqu.edu.cn/login",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "same-site",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
            },
            followRedirect: false,
        }
        result = await get(location, options);

        cookieList = result.response['headers']['set-cookie'];
        if (cookieList) {
            for (let i = 0; i < cookieList.length; i++) {
                const cookieStr = cookieList[i];
                const cookieMap = cookieStr.split(";")[0].split("=");
                cookies[cookieMap[0]] = cookieMap[1];
            }
        }
        //https://self.cqu.edu.cn/login
        location = result.response['headers']['location'];
        options.headers["Host"] = "self.cqu.edu.cn";
        cookieList = [];
        cookieList.push("SESSION=" + cookies['SESSION']);
        options.headers["Cookie"] = cookieList.join("; ")
        
        result = await get(location, options);
        //https://sso.cqu.edu.cn/oauth2.0/authorize?client_id=OC4wNS4wNS4wNy4wMC4wMy4wMS4wMS4w&redirect_uri=https://self.cqu.edu.cn/login&response_type=code&scope=read%20write&state=ZP6bGY
        location = result.response['headers']['location'];
        options.headers["Host"] = "sso.cqu.edu.cn";
        
        cookieList = [];
        cookieList.push("rg_objectid=" + cookies["rg_objectid"]);
        cookieList.push("SOURCEID_TGC=" + cookies["SOURCEID_TGC"]);
        cookieList.push("SESSION=" + firstSession);
        options.headers["Cookie"] = cookieList.join("; ")
        result = await get(location, options);
        //https://sso.cqu.edu.cn/login?service=https%3A%2F%2Fsso.cqu.edu.cn%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DOC4wNS4wNS4wNy4wMC4wMy4wMS4wMS4w%26redirect_uri%3Dhttps%253A%252F%252Fself.cqu.edu.cn%252Flogin%26response_type%3Dcode%26client_name%3DCasOAuthClient
        location = result.response['headers']['location'];
        options.headers["Cookie"] = cookieList.join("; ")
        options.headers["Host"] = "sso.cqu.edu.cn";
        
        result = await get(location, options);
        //https://sso.cqu.edu.cn/oauth2.0/callbackAuthorize?client_id=OC4wNS4wNS4wNy4wMC4wMy4wMS4wMS4w&redirect_uri=https%3A%2F%2Fself.cqu.edu.cn%2Flogin&response_type=code&client_name=CasOAuthClient&ticket=ST-39859-1eS8llP3uWSr-w7Jjjk8Q6HRLoUrg-sso-78c4d767fd-8xng4
        location = result.response['headers']['location'];
        options.headers["Cookie"] = cookieList.join("; ")
        result = await get(location, options);
        //https://sso.cqu.edu.cn/oauth2.0/authorize?client_id=OC4wNS4wNS4wNy4wMC4wMy4wMS4wMS4w&redirect_uri=https://self.cqu.edu.cn/login&response_type=code&scope=read%20write&state=ZP6bGY
        location = result.response['headers']['location'];
        options.headers["Host"] = "sso.cqu.edu.cn";
        options.headers["Cookie"] = cookieList.join("; ")
        result = await get(location, options);
        //https://self.cqu.edu.cn/login?code=OC-291-msG2amGe7A9pkYEt7nxXeY2dwRhwu8wd&state=ZP6bGY
        location = result.response['headers']['location'];
        
        cookieList = [];
        cookieList.push("SESSION=" + cookies['SESSION']);
        options.headers["Cookie"] = cookieList.join("; ")
        options.headers["Host"] = "self.cqu.edu.cn";
        result = await get(location, options);
        //https://self.cqu.edu.cn/cas-success
        location = result.response['headers']['location'];
        cookieList = result.response['headers']['set-cookie'];
        if (cookieList) {
            for (let i = 0; i < cookieList.length; i++) {
                const cookieStr = cookieList[i];
                const cookieMap = cookieStr.split(";")[0].split("=");
                cookies[cookieMap[0]] = cookieMap[1];
            }
        }
        cookieList = [];
        cookieList.push("SESSION=" + cookies['SESSION']);
        options.headers["Cookie"] = cookieList.join("; ")
        result = await get(location, options);
        //https://self.cqu.edu.cn/cas-success/
        location = result.response['headers']['location'];
        options.headers["Cookie"] = cookieList.join("; ")
        result = await get(location, options);
        statusCode = result.response.statusCode;
        if(statusCode === 200){
            //https://self.cqu.edu.cn/getUser?1664701621512
            location = 'https://self.cqu.edu.cn/getUser';
            options = {
                headers: {
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Accept-Language": "zh-CN,zh;q=0.9",
                    "cache-control":"max-age=0",
                    
                    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
                    'Cookie': cookieList.join("; ")
                },
                followRedirect: false,
            }

            result = await get(location, options);
            let userJson = JSON.parse(result.body);
            let objectId = userJson['objectId']


            location = 'https://self.cqu.edu.cn/linkid/api/aggregate/user/userinfo/'+objectId;
            result = await get(location, options);
            userJson = JSON.parse(result.body);
            console.log(userJson)
            userJson = userJson.data;
            orgInfo = userJson.orgInfo;
            department = "重庆大学"
            if(orgInfo.length > 0){
                orgInfo0 = orgInfo[0];
                if(orgInfo[0]["org"] != undefined && orgInfo[0]["org"].length > 1)
                    department = orgInfo[0]["org"][1].title;
            }
            
            let user = {
                department: department,
                userId: userJson.GH,
                name: userJson.XM,
                sex: userJson.XB,
                userTypeName: userJson.SFLBMC,
                userType: userJson.SFLBDM
            }
            if(user.userType === "01"){
                user.userType = 2;
            }
            var courseUserInfo = await requestUserInfoOfcourse(cookies);
            Object.assign(user, courseUserInfo);
            return {
                type: 'success',
                user: user
            }
        }
        
    }else if(statusCode === 401){
        return {
            type: 'error',
            content: "用户名或密码错误，请确认后重新输入！"
        }
    }
}

async function requestUserInfoOfcourse(cookies) {
    var cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }
    //         https://sso.cqu.edu.cn/login?service=https://my.cqu.edu.cn/authserver/authentication/cas
    let url = "https://sso.cqu.edu.cn/login?service=https://my.cqu.edu.cn/authserver/authentication/cas";
    var options = {
        headers: {
            'Host': 'sso.cqu.edu.cn',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Sec-Fetch-Site': 'same-site',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Dest': 'document',
            'sec-ch-ua': ' Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Referer': 'https://my.cqu.edu.cn/',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            "Cookie": cookieList.join("; ")
        },
        followRedirect: false,
    }
    result = await get(url, options);
    cookieList = result.response['headers']['set-cookie'];
    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }
    url = result.response['headers']['location'];;
    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }
    options = {
        headers: {
            'Host': 'sso.cqu.edu.cn',
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Dest': 'document',
            'Referer': 'https://sso.cqu.edu.cn/login?service=https://my.cqu.edu.cn/authserver/authentication/cas',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cookie': cookieList.join("; ")
        },
        followRedirect: false,
    }
    result = await get(url, options);
    let location = result.response['headers']['location'];
    cookieList = result.response['headers']['set-cookie'];
    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }


    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    location = "https://my.cqu.edu.cn/authserver/oauth/authorize?client_id=personal-prod&response_type=code&scope=all&state=&redirect_uri=https://my.cqu.edu.cn/workspace/token-index";
    options = {
        headers: {


            'Host': 'my.cqu.edu.cn',
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Dest': 'document',
            'Referer': 'https://my.cqu.edu.cn/workspace/cas',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            //'Cookie': 'redirect_uri=https://my.cqu.edu.cn/workspace/cas; FSSBBIl1UgzbN7NO=51vNJIH0lj5iylrH4zGAOWdxopMWT57RL.MfXtDSoVRPySwqaXrq.uqJwJG9zLWmdEkffbC0cIHjCWt1_LAot2A; Hm_lvt_fbbe8c393836a313e189554e91805a69=1653283249,1653551528; Hm_lpvt_fbbe8c393836a313e189554e91805a69=1653551528; iPlanetDirectoryPro=XuLdpOQe4LXkOmdP1exdXy; SESSION=OTJmY2M3MDktODBjYS00Y2QxLWI1NGEtMzI4MTRiZDMwOWRm; FSSBBIl1UgzbN7NP=53LZSFDtHWQVqqqDqdTOdGA6X1UVXr2MzlQ6ak3tW1TjEAc9_S3JjTAwxpheUY.VlChwB4LIG2ZhkfOfYEcfGeUXwPj6k9PU2VLUgYJP1RgkEqSynIWHNSpNtYmlvqK6kxdQnDM8f1TDX1RVPUUi02d.AxvaLd5R_jvIIENpVnnLX.fbLxI4MniaNXkEBlMjK5pe8uYeyMuQ.BJ7scTeCSbPihKgaSQq9M2zm.Amf2IssffTt82PMQFom_SEYwxnTfUyiFpgbbHLaRoiqEzsj4M',
            'Cookie': cookieList.join("; ")
        },
        followRedirect: false,
    }
    result = await get(location, options);
    location = result.response['headers']['location'];

    let urlObj = new URL(location);
    let code = urlObj.searchParams.get("code");


    url = "https://my.cqu.edu.cn/authserver/oauth/token";

    let form = {
        "client_id": "personal-prod",
        "client_secret": "app-a-1234",
        "code": code,
        "redirect_uri": "https://my.cqu.edu.cn/workspace/token-index",
        "grant_type": "authorization_code"
    };
    cookieList = [];
    cookieList.push("SESSION=" + cookies['SESSION']);
    cookieList.push("iPlanetDirectoryPro=" + cookies['iPlanetDirectoryPro']);
    cookieList.push("redirect_uri=https://my.cqu.edu.cn/workspace/cas");
    options = {
        headers: {
            'Host': 'my.cqu.edu.cn',
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic cGVyc29uYWwtcHJvZDphcHAtYS0xMjM0',
            'sec-ch-ua-mobile': '?0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'sec-ch-ua-platform': '"Windows"',
            'Origin': 'https://my.cqu.edu.cn',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://my.cqu.edu.cn/workspace/token-index?code='+ code +'&state=',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            "Cookie": cookieList.join("; ")
        },
        gzip: true,
        form: form,
        followRedirect: false
    }
    result = await post(url, options);

    cookieList = result.response['headers']['set-cookie'];
    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }
    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    let body = result.body;
    let bodyJson = JSON.parse(body);
    const access_token = bodyJson.access_token;
    url = "https://my.cqu.edu.cn/authserver/simple-user";
    options = {
        headers: {
            'Host': 'my.cqu.edu.cn',
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            'Accept': 'application/json',
            'Authorization': 'Bearer '+ access_token,
            'sec-ch-ua-mobile': '?0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://my.cqu.edu.cn/workspace/token-index?code='+ code +'&state=',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cookie': cookieList.join("; ")
        },
        gzip: true,
        followRedirect: false,
    }
    result = await get(url, options);
    bodyJson = JSON.parse(result.body);
    let user = {
        department: bodyJson.deptName,
        userId: bodyJson.tag,
        name: bodyJson.name,
        username: bodyJson.username,
        phoneNumber: bodyJson.phoneNumber,
        code: bodyJson.code,
    }
    await logout(access_token,cookies);
    return user;
}

async function logout(access_token, cookies) {
    let cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    cookies["redirect_uri"] = "https://my.cqu.edu.cn/tt/cas";

    let location = "https://my.cqu.edu.cn/authserver/logout";
    let options = {
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Connection": "keep-alive",
            "Host": "my.cqu.edu.cn",
            "Authorization": "Bearer " + access_token,
            "Referer": "https://my.cqu.edu.cn/tt/Home",
            'sec-ch-ua': ' Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": " cors",
            "Sec-Fetch-Site": " same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Cookie": cookieList.join("; ")
        },
        followRedirect: false
    }
    await get(location, options);

    location = "https://my.cqu.edu.cn/authserver/remove_token";
    await get(location, options);

    options = {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9 ",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Connection": "keep-alive",
            "Host": "my.cqu.edu.cn",
            "Upgrade-Insecure-Requests": "1",
            "Referer": "https://my.cqu.edu.cn/tt/Home",
            'sec-ch-ua': ' Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": " navigate",
            "Sec-Fetch-Site": " same-origin",
            "Sec-Fetch-User": " ?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Cookie": cookieList.join("; ")
        },
        followRedirect: false
    }
    location = "https://my.cqu.edu.cn/authserver/casLogout?redirect_uri=https://my.cqu.edu.cn/tt/cas";
    result = await get(location, options);
    cookieList = result.response['headers']['set-cookie'];

    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }
    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    options = {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9 ",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Connection": "keep-alive",
            "Host": "my.cqu.edu.cn",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Cookie": cookieList.join("; ")
        },
        followRedirect: false
    }
    location = "http://authserver.cqu.edu.cn/authserver/logout?service=http://my.cqu.edu.cn/authserver/authentication/cas";
    result = await get(location, options);
}


async function get(paramURL, paramOptions) {
    let [error, response, body] = await utils.WaitClassFunctionEx(request, "get", paramURL, paramOptions);
    return {
        error,
        response,
        body
    };
}
/**
 * 同步请求post URL
 * @param {string} paramURL 请求的URL
 * @param {*} paramOptions 等同于request的options, 请参考其具体使用方法
 * @return {{error:*, response:*, body:*}} 
 */
async function post(paramURL, paramOptions) {

    // let rep = await axios({
    //     method: 'post',
    //     url: paramURL,
    //     headers:paramOptions.headers,
    //     data: qs.stringify(paramOptions.form)
    // })


    let [error, response, body] = await utils.WaitClassFunctionEx(request, "post", paramURL, paramOptions);
    return {
        error,
        response,
        body
    };
}