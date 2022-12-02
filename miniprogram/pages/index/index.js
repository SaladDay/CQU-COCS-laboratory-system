var app = getApp();
var moment = require('../utils/moment');
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({
    data: {
        active: 0,
        dutyActive: 1,
        grid_column: 3,
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        weekDayMap: {
            1: "星期一",
            2: "星期二",
            3: "星期三",
            4: "星期四",
            5: "星期五",
            6: "星期六",
            7: "星期日"
        },
        morningMap: {
            1: '上午',
            2: "下午",
            3: "晚上"
        },
        gridList: [],
        
    },
    
    onDutyChange(event) {
        wx.showToast({
            title: `切换到标签 ${event.detail.name}`,
            icon: 'none',
        });
    },

    onChange(event) {
        // event.detail 的值为当前选中项的索引
        // this.setData({
        //     active: event.detail
        // });
        console.log(event.detail);
        if(event.detail == 0){
            wx.navigateTo({
                url: '../index/index',
            })
        }
        if(event.detail == 1){
            wx.scanCode({
                success (res) {
                  console.log(res)
                  wx.showModal({
                    title: '提示',
                    content: res.result,
                    success: function (res) {
                      
                    }
                  })
                }
              })
        }
        if(event.detail == 2){
            wx.navigateTo({
                url: '../my/index',
            })
        }
    },
    
    onChooseAvatar(e) {
        const {
            avatarUrl
        } = e.detail
        this.setData({
            avatarUrl,
        })
    },

    requestWeekScheduler: async function (e) {
        var curWeekDay = this.data.curWeekDay;
        var semester = app.globalData.semester;
        var data = {
            type: 'schedulerManage',
            opt: "findbyWhere",
            where: {
                semesterId:semester._id,
                weekNum: this.data.curWeek,
                weekDay: curWeekDay
            }
        }

        var resp = await app.requestCloud(data);
        var schedulerList = resp.result.data;
        var length = schedulerList.length;
        var schedulerMap = {
            1:[],2:[],3:[]
        };
        
        for (var i = 0; i < length; i++) {
            var scheduler = schedulerList[i];
            var morning = scheduler.morning;
            schedulerMap[morning].push(scheduler)
        }
        var schedulers = [];
        var morningKeys = Object.keys(schedulerMap);
        morningKeys.sort();
        var morningCoursesLen = morningKeys.length;
        var morningCourses = [];
        for (var j = 0; j < morningCoursesLen; j++) {
            if (schedulerMap[morningKeys[j]].length > 1) {
                schedulerMap[morningKeys[j]].sort(function (a, b) {
                    var aRoomName = a.room.name;
                    var bRoomName = b.room.name;
                    if (aRoomName < bRoomName) {
                        return -1;
                    }
                    if (aRoomName > bRoomName) {
                        return 1;
                    }
                    return 0;
                });
            }
            morningCourses.push({
                key: this.data.morningMap[morningKeys[j]],
                courses: schedulerMap[morningKeys[j]]
            });
        }
        
        console.log(morningCourses)
        this.setData({
            schedulerList: morningCourses
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        app.showLoading('加载中')
        if(!app.globalData.semester){
            console.log("index.js onload 请求学期")
            await app.requestCurrentSemester();
            console.log("index.js onload 结束请求学期")
        }
        console.log('userInfo为')
        console.log(app.globalData.userInfo)
        if(!app.globalData.userInfo){
            console.log("index.js onload 请求当前用户")
            await app.requestUserInfo();
            console.log("index.js onload 结束请求当前用户")
            if(!app.globalData.userInfo){
                console.log("从app.js跳转至login页面...")
                wx.navigateTo({
                  url: '/pages/login/index?nextUrl=/pages/index/index',
                })
            }else{
                await this.initData();
            }
        }else{
            await this.initData();
        }
    },

    initData: async function(){
        var semester = app.globalData.semester;
        var curWeek = app.globalData.curWeek;
        var maxWeek = app.globalData.maxWeek;
        var selectWeek = curWeek + 1;
        var curWeekDay = new moment().weekday();
        curWeekDay = curWeekDay === 0?7:curWeekDay;
        this.setData({
            semester: semester,
            curWeek: curWeek,
            selectWeek: selectWeek,
            maxWeek: maxWeek,
            curWeekDay: curWeekDay,
            userInfo: app.globalData.userInfo
        });
        wx.hideLoading({
            success: (res) => {},
        })
        this.setGridList();
        await this.requestWeekScheduler();
    },

    setGridList:function(){
        var userInfo = this.data.userInfo;
        console.log(userInfo)
        if(!userInfo){

        }
        var userType = parseInt(userInfo.userType);
        var gridList = [];
        
        if(userType === 0){//实验人员
            gridList.push({
                text: '值班查询',
                url: '../schedualQuery/index',
                icon: '/pages/images/week_course.svg'
            },{
                text: '课表查询',
                url: '../courseQuery/index',
                icon: '/pages/images/week_course.svg'
            },{
                text: '个人信息',
                url: '../schedualQuery/index',
                icon: '/pages/images/week_course.svg'
            },{
                text: '我的值班',
                url: '../mySchedual/index',
                icon: '/pages/images/week_course.svg'
            });
            var scheduler = userInfo.scheduler;
            var manager = userInfo.manager;
            if(scheduler && !manager){//排班员
                gridList.push({
                    text: '排班管理',
                    url: '../schedualManage/index',
                    icon: '/pages/images/course.svg'
                }) 
            }
            
            if(manager){//管理员
                gridList.push({
                    text: '排班管理',
                    url: '../schedualManage/index',
                    icon: '/pages/images/course.svg'
                }, {
                    text: '学期管理',
                    url: '../semesterManage/index',
                    icon: '/pages/images/semester.svg'
                }, {
                    text: '用户管理',
                    url: '../userManage/index',
                    icon: '/pages/images/user.svg'
                }, {
                    text: '教室管理',
                    url: '../roomManage/index',
                    icon: '/pages/images/roomManage.svg'
                },{
                    text:'设备类型管理',
                    url:'../equipTypeManage/equipTypeManage',
                    icon: '/pages/images/equipManage.svg'

                },{
                    text:'设备管理',
                    url:'../equipManage/equipManage',
                    icon: '/pages/images/equipManage.svg'
                },{
                    text:'设备报修',
                    url:'../equipRepair/equipRepair',
                    icon: '/pages/images/equipRepair.svg'
                },{
                    text:'我的报修',
                    url:'../myEquipRepair/myEquipRepair',
                    icon: '/pages/images/allEquipRepair.svg'
                },{
                    text:'报修管理',
                    url:'../allEquipRepair/allEquipRepair',
                    icon: '/pages/images/allEquipRepair.svg'
                }) 
            }

        }else if(userType === 1){//学生
            userType = 2;

        }else{//教师
            gridList.push({
                text: '课表查询',
                url: '../courseQuery/index',
                icon: '/pages/images/week_course.svg'
            },{
                text: '值班查询',
                url: '../schedualQuery/index',
                icon: '/pages/images/week_course.svg'
            },{
                text: '我的课表',
                url: '../mySchedual/index',
                icon: '/pages/images/week_course.svg'
            },{
                text:'设备报修',
                url:'../equipRepair/equipRepair',
                icon: '/pages/images/equipRepair.svg'
            },{
                text:'我的报修',
                url:'../myEquipRepair/myEquipRepair',
                icon: '/pages/images/allEquipRepair.svg'
            });
        }

        var gridListLen = gridList.length;
        var grid_column = 3;
        if (gridListLen < 3) {
            grid_column = 0;
        } else if (gridListLen < 5) {
            grid_column = gridListLen;
        } else {
            grid_column = 3;
        }

        this.setData({
            gridList:gridList,
            grid_column: grid_column
        })
    },

    onCertificationSubmit: async function (e) {
        var fullName = this.data.fullname;
        var userId = this.data.userId;
        var registerCode = this.data.registerCode;
        var entity = {
            name: fullName,
            userId: userId,
            registerCode: registerCode
        }
        var data = {
            type: "userManage",
            opt: "certificate",
            entity: entity
        }
        var resp = await app.requestCloud(data);
        console.log(resp);
        var result = resp.result;

        if (result.success === false) {
            Dialog.alert({
                message: result.errMsg,
            }).then(() => {
                // on confirm
            });
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})