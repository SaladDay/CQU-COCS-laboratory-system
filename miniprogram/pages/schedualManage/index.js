// pages/schedualManage/index.js
var app = getApp();
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        steps: [{
            text: '更新课表',
        }, {
            text: '更新规则',
        }, {
            text: '排班',
        }, {
            text: '发布',
        }],
        rule_list_more_sign: [false, false, false, false, false, false, false],
        weekDayMap: {
            1: "周一",
            2: "周二",
            3: "周三",
            4: "周四",
            5: "周五",
            6: "周六",
            7: "周日"
        },
        morningMap: {
            1: '上午',
            2: "下午",
            3: "晚上"
        },
        active: 0,
        courseTabActive: 0,
        captchaImg: '',
        captchaImgStr: ''
    },

    onCourseEditClick: function (e) {
        var indexStr = e.currentTarget.dataset.id;
        var indexs = indexStr.split("-");
        indexs[2] = parseInt(indexs[2]);
        var course = this.data.courseList[indexs[0]].morningCourses[indexs[1]].courses[indexs[2]];

        var userMap = this.data.userMap;
        var maxWeek = this.data.maxWeek;
        var selectWeek = this.data.selectWeek;

        var data = {
            userMap: userMap,
            course: course,
            maxWeek: maxWeek,
            selectWeek: selectWeek
        }
        wx.navigateTo({
            url: '../schedualManage/course/edit/index?data=' + JSON.stringify(data),
        });

    },

    onCourseRemoveClick: async function (e) {
        var indexStr = e.currentTarget.dataset.id;
        var indexs = indexStr.split("-");
        indexs[2] = parseInt(indexs[2]);
        var course = this.data.courseList[indexs[0]].morningCourses[indexs[1]].courses[indexs[2]];
        var that = this;
        wx.showModal({
            title: '确认',
            content: '您确认删除课程“' + course.courseName + '”吗？',
            success(res) {
                if (res.confirm) {
                    that.requestRemoveCourse(course);
                } else if (res.cancel) {
                    console.log('用户点击取消')
                }
            }
        });

    },


    requestRemoveCourse: async function (course) {

        wx.showLoading({
            title: '请稍后...',
        })
        var data = {
            type: "schedulerManage",
            opt: 'removeCourseAndScheduler',
            course: course
        }

        wx.hideLoading();
        var resp = await app.requestCloud(data);
        this.refresh();
        // var pageSwitch = resp.result.data.pageSwitch;
        // if (pageSwitch) {
        //     var morning = course.morning;
        //     var weekDay = course.weekDay;
        //     if (weekDay < 6 && morning < 3) {
        //         if (morning === 1) {
        //             morning = "上午";
        //         } else if (morning === 2) {
        //             morning = "下午";
        //         } else {
        //             morning = "晚上";
        //         }
        //         var message = "系统检测到第" + course.weekNum + "周星期" + course.weekDay + morning + "实验室无人坐班，是否跳转至添加值班页面";
        //         wx.showModal({
        //             title: "确认",
        //             content: message,
        //             success(res1) {
        //                 if (res1.confirm) {
        //                     // 跳转编辑值班页面
        //                     console.log("跳转到添加值班页面");
        //                 } else {
        //                     this.refresh();
        //                     return;
        //                 }
        //             }
        //         })
        //     }
        // }else{
        //     this.refresh();
        // }
    },


    onCourseMoreClick: function (e) {
        var indexStr = e.currentTarget.dataset.id;
        var indexs = indexStr.split("-");
        indexs[2] = parseInt(indexs[2]);
        var course_list_more_sign = this.data.course_list_more_sign;
        for (var idx in course_list_more_sign) {
            for (var i in course_list_more_sign[idx].morningCourses) {
                var courseSigns = course_list_more_sign[idx].morningCourses[i].courses;
                var len = courseSigns.length;
                for (var courseIndex = 0; courseIndex < len; courseIndex++) {
                    if (idx === indexs[0] && i === indexs[1] && courseIndex === indexs[2]) {
                        courseSigns[courseIndex] = !courseSigns[courseIndex];
                    } else {
                        courseSigns[courseIndex] = false;
                    }
                }
            }
        }
        console.log(course_list_more_sign)
        this.setData({
            course_list_more_sign: course_list_more_sign
        })
    },

    onEditClick: function (e) {
        
        var id = e.currentTarget.dataset.id;
        var rule = this.data.ruleList[id];
        var managerIndex = this.data.managerIdList.indexOf(rule.managerId);
        var dutyerIndex = this.data.dutyerIdList.indexOf(rule.dutyerId);
        var weekIndex = rule.weekDay;
        var data = {
            _id: rule._id,
            weekIndex: weekIndex - 1,
            managerIndex: managerIndex,
            managerId: rule.managerId,
            dutyerIndex: dutyerIndex,
            dutyerId: rule.dutyerId,
            isScheduler:rule.isScheduler?true:false
        }
        wx.navigateTo({
            url: '../schedualManage/rule/edit/index?data=' + JSON.stringify(data),
        });

    },

    onRemoveClick: async function (e) {
        wx.showLoading({
            title: '请稍后...',
        })
        var id = e.currentTarget.dataset.id;
        var data = this.data.ruleList[id];
        var _id = data._id;
        var data = {
            type: "rules",
            opt: 'remove',
            _id: _id
        }

        wx.showLoading({
            title: '请稍后...',
        })
        await app.requestCloud(data);
        wx.hideLoading({
            success: (res) => {
                this.refresh();
            },
        });
    },

    onMoreClick: function (e) {
        var id = e.currentTarget.dataset.id;
        var list_more_sign = this.data.rule_list_more_sign;
        var len = list_more_sign.length;
        for (var i = 0; i < len; i++) {
            if (i === id) {
                list_more_sign[id] = !this.data.rule_list_more_sign[id];
            } else {
                list_more_sign[i] = false;
            }
        }

        this.setData({
            rule_list_more_sign: list_more_sign
        })
    },

    goLastStep: function (e) {
        var active = this.data.active;
        if (active > 0) {
            active = active - 1;
        }
        this.setData({
            active: active
        });

        if (active === 2 || active === 3) {
            this.requestWeekScheduler();
        }
        if (active === 1) {
            this.requestRuleList();
        }
        if (active === 0) {
            this.requestWeekCourse();
        }
    },

    goNextStep: function (e) {
        var active = this.data.active;
        if (active < (this.data.steps.length - 1)) {
            active = active + 1;
        }
        this.setData({
            active: active
        });
        if (active === 2 || active === 3) {
            this.requestWeekScheduler();
        }
        if (active === 1) {
            this.requestRuleList();
        }
        if (active === 0) {
            this.requestWeekCourse();
        }
    },



    onWeekChange: async function (e) {
        console.log(e.detail);
        var selectWeek = e.detail;
        this.setData({
            selectWeek: selectWeek
        });
        var active = this.data.active;
        if (active === 0) {
            await this.requestWeekCourse();
        } else if (active === 1) {
            await this.requestRuleList();
        } else if (active === 2) {
            await this.requestWeekScheduler();
        } else if (active === 3) {
            await this.requestWeekScheduler();
        }
    },

    requestWeekScheduler: async function (e) {
        app.showLoading('获取第' + this.data.selectWeek + "周排班表");
        var semester = app.globalData.semester;
        var data = {
            type: 'schedulerManage',
            opt: "findSchedulersbyUserAndWeekNum",
            where: {
                weekNum: this.data.selectWeek,
                semesterId:semester._id,
            }
        };
        var resp = await app.requestCloud(data);
        app.hideLoading();
        var schedulerList = resp.result.data;
        var length = schedulerList.length;
        var schedulerMap = {};
        for (var i = 0; i < length; i++) {
            var scheduler = schedulerList[i];
            var weekDay = scheduler.weekDay;
            var morning = scheduler.morning;
            if (!schedulerMap.hasOwnProperty(weekDay)) {
                schedulerMap[weekDay] = {};
            }
            if (!schedulerMap[weekDay].hasOwnProperty(morning)) {
                schedulerMap[weekDay][morning] = [];
            }
            schedulerMap[weekDay][morning].push(scheduler)
        }
        var schedulers = [];
        var keys = Object.keys(schedulerMap);
        keys.sort();
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var morningKeys = Object.keys(schedulerMap[key]);
            morningKeys.sort();
            var morningCoursesLen = morningKeys.length;
            var morningCourses = [];
            for (var j = 0; j < morningCoursesLen; j++) {
                if (schedulerMap[key][morningKeys[j]].length > 1) {
                    schedulerMap[key][morningKeys[j]].sort(function (a, b) {
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
                    courses: schedulerMap[key][morningKeys[j]]
                });
            }

            schedulers.push({
                key: this.data.weekDayMap[key],
                morningCourses: morningCourses
            })
        }

        this.setData({
            schedulerList: schedulers
        });
    },

    requestWeekCourse: async function (e) {
        var weekDayMap = {
            1: "周一",
            2: "周二",
            3: "周三",
            4: "周四",
            5: "周五",
            6: "周六",
            7: "周日"
        }
        var morningMap = {
            1: '上午',
            2: "下午",
            3: "晚上"
        }
        wx.showLoading({
            title: '获取第' + this.data.selectWeek + "周课表",
        });
        var semester = app.globalData.semester;
        var data = {
            type: 'updateCourseInfo',
            opt: "findCourseList",
            where: {
                semesterId:semester._id,
                weekNum: this.data.selectWeek
            }
        }
        var resp = await app.requestCloud(data);
        console.log(resp);
        wx.hideLoading({
            success: (res) => {},
        })
        var coursesTotels = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        var coursesTemp = [];
        var course_list_more_sign = [];
        var courseTabActive = 0;

        var courses = resp.result.list;
        if (courses && courses.length > 0) {
            var len = courses.length;
            var courseList = {};
            for (var i = 0; i < len; i++) {
                var course = courses[i];
                var weekDay = parseInt(course.weekDay);
                if (!courseList.hasOwnProperty(weekDay)) {
                    courseList[weekDay] = {};
                }
                var morning = parseInt(course.morning);
                if (!courseList[weekDay].hasOwnProperty(morning)) {
                    courseList[weekDay][morning] = [];
                }
                courseList[weekDay][morning].push(course);
            }
            for (var i in courseList) {
                for (var j in courseList[i]) {
                    courseList[i][j].sort(function (a, b) {
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
            }

            var keys = Object.keys(courseList);
            keys.sort();
            for (var i = 0; i < keys.length; i++) {
                var dayCourses = courseList[keys[i]];
                var info = 0;
                var morningKeys = Object.keys(dayCourses);
                morningKeys.sort();
                var morningCoursesTemp = [];
                var morning_list_more_sign = [];
                var courseTotelX = parseInt(keys[i]) - 1;
                for (var j = 0; j < morningKeys.length; j++) {
                    var courseTotelY = parseInt(morningKeys[j]) - 1;
                    var coursesTotel = courseList[keys[i]][morningKeys[j]].length;
                    coursesTotels[courseTotelX][courseTotelY] = coursesTotel;
                    morningCoursesTemp.push({
                        key: morningMap[morningKeys[j]],
                        courses: courseList[keys[i]][morningKeys[j]]
                    });
                    var sign_more_list = [];
                    for (var k = 0; k < coursesTotel; k++) {
                        var isSchedul = courseList[keys[i]][morningKeys[j]][k].isSchedul;
                        if (isSchedul === 0) {
                            info++;
                        }
                        sign_more_list.push(false);
                    }
                    morning_list_more_sign.push({
                        key: morningMap[morningKeys[j]],
                        courses: sign_more_list
                    });
                }
                coursesTemp.push({
                    key: weekDayMap[keys[i]],
                    morningCourses: morningCoursesTemp,
                });

                course_list_more_sign.push({
                    key: weekDayMap[keys[i]],
                    dot: info > 0,
                    morningCourses: morning_list_more_sign,
                });
            }
            courseTabActive = Math.floor(coursesTemp.length / 2);
        }
        console.log("courseTabActive："+courseTabActive)
        this.setData({
            courseList: coursesTemp,
            course_list_more_sign: course_list_more_sign,
            courseTabActive: courseTabActive,
            coursesTotels: coursesTotels
        });
        this.selectComponent('#courseTaps').resize();
    },

    startScheduler: async function (e) {
        app.showLoading("排班中...");
        var semester = app.globalData.semester;
        var data = {
            type: "schedulerManage",
            opt: 'startScheduler',
            semesterId:semester._id,
            selectWeek: this.data.selectWeek
        }
        await app.requestCloud(data);
        app.hideLoading();
        await this.requestWeekScheduler();
    },

    publishScheduler: async function (e) {
        var semester = app.globalData.semester;
        var data = {
            type: "schedulerManage",
            opt: 'publishScheduler',
            semesterId:semester._id,
            selectWeek: this.data.selectWeek
        }
        await app.requestCloud(data);

        await this.requestWeekScheduler();
    },

    requestRuleList: async function () {

        var data = {
            type: "schedulerManage",
            opt: 'findAllRule'
        }

        app.showLoading('获取规则');
        var resp = await app.requestCloud(data);
        app.hideLoading();

        console.log(resp);
        var data = resp.result.data;
        if (!data) {
            this.setData({
                ruleIdList: [],
                ruleList: []
            });
            return;
        }
        var len = data.length;
        var ruleIdList = [];
        var ruleList = [];
        for (var i = 0; i < len; i++) {

            var rule = data[i];
            rule.id = i;
            ruleIdList.push(data[i]._id);
            var dutyerRules = rule.dutyerRules;

            var dutyerNameList = [];
            for (var j = 0; j < dutyerRules.length; j++) {
                dutyerNameList.push(dutyerRules[j].scheduler[0].name);
            }
            if (dutyerRules.length > 0) {
                var dutyerConflictStr = "与" + dutyerNameList.join("、") + "的规则冲突！"
                rule.dutyerConflictStr = dutyerConflictStr;
            }

            var managerRules = rule.managerRules;
            var managerNameList = [];
            for (var j = 0; j < managerRules.length; j++) {
                managerNameList.push(managerRules[j].scheduler[0].name);
            }

            if (managerRules.length > 0) {
                var managerConflictStr = "与" + managerNameList.join("、") + "的规则冲突！"
                rule.managerConflictStr = managerConflictStr;
            }

            var weekDay = rule.weekDay;
            rule.weekDayStr = this.data.weekDayMap[weekDay];
            rule.coursesTotels = this.data.coursesTotels[weekDay - 1];
            console.log(rule);
            ruleList.push(rule);
        }

        this.setData({
            ruleIdList: ruleIdList,
            ruleList: ruleList
        });

        console.log(data);

    },

    requestUserList: async function () {
        var data = {
            type: "userManage",
            opt: 'findbyWhere',
            where: {
                userType: 0
            }
        }
        var resp = await app.requestCloud(data);
        var data = resp.result.data;
        if (!data) {
            return;
        }
        var len = data.length;
        var managerList = [];
        var dutyerList = [];
        var managerNameList = [];
        var dutyerNameList = [];
        var managerIdList = [];
        var dutyerIdList = [];
        var user = null;
        var userMap = {};

        for (var i = 0; i < len; i++) {

            user = data[i];
            userMap[user._id] = user;

            managerList.push(user);
            managerIdList.push(user._id);
            managerNameList.push(user.name);

            dutyerList.push(user);
            dutyerIdList.push(user._id);
            dutyerNameList.push(user.name);

        }
        this.setData({
            dutyerIdList: dutyerIdList,
            managerIdList: managerIdList,
            managerList: managerList,
            managerNameList: managerNameList,
            dutyerList: dutyerList,
            dutyerNameList: dutyerNameList,
            userMap: userMap
        });
        console.log(resp)
    },

    async updateCourseInfo() {
        var user = app.globalData.userInfo;
        var where = {
            schedulerId: user._id
        }

        var data = {
            type: 'rooms',
            opt: 'findbyWhere',
            where: where
        }
        var resp = await app.requestCloud(data);
        var rooms = resp.result.data;
        console.log(rooms);
        if (rooms.length === 0) {
            wx.showToast({
                title: '您没有排班权限，请联系管理员！',
                icon: 'success',
                duration: 2000
            })
            return;
        }

        var roomlen = rooms.length;
        for (var i = 0; i < roomlen; i++) {
            var room = rooms[i];
            var roomId = room._id;
            var roomName = room.name;
            var selectWeek = this.data.selectWeek;
            wx.showLoading({
                title: '抓取' + roomName + "的课表信息...",
            });
            var semester = app.globalData.semester;
            data = {
                type: 'updateCourseInfo',
                opt: 'crawlerCourseListByRoom',
                selectWeek: selectWeek,
                roomId: roomId,
                roomName: roomName,
                semesterId:semester._id
            }
            await app.requestCloud(data);
            wx.hideLoading();
        }

        await this.requestWeekCourse();
    },



    /**
     * 
     * @param {*} e 
     */
    onAddRuleClick: function (e) {
        var weekList = [{
            text: '星期一',
            value: 1
        }, {
            text: '星期二',
            value: 2
        }, {
            text: '星期三',
            value: 3
        }, {
            text: '星期四',
            value: 4
        }, {
            text: '星期五',
            value: 5
        }, {
            text: '星期六',
            value: 6
        }, {
            text: '星期日',
            value: 7
        }]
        var ruleList = this.data.ruleList;
        for(var i = 0 ; i < ruleList.length ; i ++){
            var rule = ruleList[i];
            var weekDay = rule.weekDay;
            weekList[weekDay-1].disabled = true;
        }
        wx.navigateTo({
            url: '../schedualManage/rule/add/index?weekList='+JSON.stringify(weekList),
        });
    },

    onAddSchedulerClick: function (e) {
        var userMap = this.data.userMap;
        var maxWeek = this.data.maxWeek;
        var selectWeek = this.data.selectWeek;
        var weekDayValue = e.currentTarget.dataset.id.key;
        var weekDayMap = this.data.weekDayMap;
        var weekDay = 1;
        for(var weekDayKey in weekDayMap){
            if(weekDayValue === weekDayMap[weekDayKey]){
                weekDay = weekDayKey;
                break;
            }
        }
        var data = {
            userMap: userMap,
            maxWeek: maxWeek,
            selectWeek: selectWeek,
            weekDay:parseInt(weekDay)
        }
        wx.navigateTo({
            url: '../schedualManage/course/add/index?data=' + JSON.stringify(data),
        });
    },

    onEditSchedulerClick: function (e) {
        var userMap = this.data.userMap;
        var curSchedulers = e.currentTarget.dataset.id;
        var data = {
            userMap: userMap,
            curSchedulers: curSchedulers
        }
        wx.navigateTo({
            url: '../schedualManage/scheduler/edit/index?data=' + JSON.stringify(data),
        });
    },

    onRemoveSchedulerClick: async function (e) {
        var schedulId = e.currentTarget.dataset.id;
        var data = {
            type: "schedulerManage",
            opt: 'remove',
            _id: schedulId
        }
        await app.requestCloud(data);
    },

    init_cloud: async function (e) {
        console.log("init_cloud");
        await this.requestUserList();
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log("onLoad");
        var semester = app.globalData.semester;
        var curWeek = app.globalData.curWeek;
        var maxWeek = app.globalData.maxWeek;
        var selectWeek = curWeek + 1;
        this.setData({
            semester: semester,
            curWeek: curWeek,
            selectWeek: selectWeek,
            maxWeek: maxWeek
        });
        console.log("onLoad");
        this.init_cloud();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    refresh: async function () {
        console.log("refresh");
        if (this.data.active === 0) {
            console.log("refresh 1");
            await this.requestWeekCourse();
        }
        if (this.data.active === 1) {
            console.log("refresh 2");
            await this.requestRuleList();
        }
        if (this.data.active === 2 || this.data.active === 3) {
            console.log("refresh 3");
            await this.requestWeekScheduler();
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        console.log("onShow");
        this.refresh();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        var list_more_sign = this.data.rule_list_more_sign;
        var len = list_more_sign.length;
        for (var i = 0; i < len; i++) {
            list_more_sign[i] = false;
        }
        this.setData({
            rule_list_more_sign: list_more_sign
        });
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