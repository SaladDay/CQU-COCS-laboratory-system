// app.js
var moment = require('pages/utils/moment');

App({

    onLaunch: async function () {
        console.log("App onLaunch");
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
            console.log("wx cloud initing ");
            wx.cloud.init({
                // env 参数说明：
                //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
                //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
                //   如不填则使用默认环境（第一个创建的环境）
                // env: 'my-env-id',
                
                env: "cloud1-4gahuybndcca4024",
                traceUser: true,
            });
            this.globalData = {
                env: {
                    "id": "cloud1-4gahuybndcca4024",
                    "alias": "cloud1"
                }
            };
            console.log("wx cloud inited ");
        }
        this.globalData = {
            env: {
                "id": "cloud1-4gahuybndcca4024",
                "alias": "cloud1"
            }
        };
    },

    onShow: async function (e) {
        
    },
   

    requestUserInfo: async function () {
        var userInfo = wx.getStorageSync('userInfo')
        if (!userInfo) {
            var data = {
                type: 'userManage',
                opt: "requestUserInfo"
            }
            var resp = await this.requestCloud(data);
            if (resp.result) {
                userInfo = resp.result[0];
                wx.setStorageSync('userInfo', userInfo);
            }
        }

        if (userInfo) {
            this.globalData.userInfo = userInfo;
        } else {
            this.globalData.userInfo = null;
        }

    },
    requestWeekScheduler: async function () {
        var data = {
            type: 'schedulerManage',
            opt: "findbyWhere",
            where: {
                weekNum: this.data.selectWeek,
            }
        }
        var resp = await this.requestbyWhere();
    },

    requestCurrentSemester: async function () {
        var semester = wx.getStorageSync('semester')
        var isRequest = false;
        if (semester) {
            var curtime = moment();
            var semesterEnd = semester.end;
            var semesterEndMoment = moment(semesterEnd);
            if (moment().isBefore(semesterEndMoment)) {
                isRequest = true;
            }
        } else {
            isRequest = true;
        }
        if (isRequest) {
            var data = {
                type: 'semesterManage',
                opt: "findMaxNew"
            }
            console.log(data)
            var resp = await this.requestCloud(data);
            var data = resp.result.data;
            if (data !== null && data.length > 0) {
                console.log(resp.result)
                semester = data[0];
                wx.setStorageSync('semester', semester);
            }
        }
        
        var start = semester.start;
        var end = semester.end;

        var startMoment = moment(start);
        var nowMoment = moment();
        var endMoment = moment(end).add(1, 'days');
        console.log(nowMoment)
        var week = nowMoment.diff(startMoment, 'weeks') + 1;
        var maxWeek = endMoment.diff(startMoment, "weeks") + 1;
        console.log("当前周次：" + week)
        this.globalData = {
            semester: semester,
            curWeek: week,
            selectWeek: week + 1,
            maxWeek: maxWeek
        };
    },

    requestCloud: async function (data) {
        var resp = await wx.cloud.callFunction({
            name: 'quickstartFunctions',
            config: {
                env: "cloud1-4gahuybndcca4024",
            },
            data: data
        });
        return resp;
    },

    requestbyWhere: async function (table, where) {
        var data = {
            type: table,
            opt: "findbyWhere",
            where: where
        }
        return await this.requestCloud(data);
    },
    showLoading:function(msg){
        wx.showLoading({
            title: msg,
            mask:true
          })
    },
    hideLoading:function(success){
        wx.hideLoading({
            success: (res) => {
                if(success)
                    success();
            },
          })
    },
});