// pages/courseQuery/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        courseTabActive: 0,
    },


    onWeekChange: async function (e) {
        console.log(e.detail);
        var selectWeek = e.detail;
        this.setData({
            selectWeek: selectWeek
        });
        var active = this.data.active;
        await this.requestWeekCourse();
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
            type: 'courses',
            opt: "findbyWhere",
            where: {
                semesterId:semester._id,
                instructorId:this.data.userInfo.code,
                weekNum: this.data.selectWeek,
            }
        }
        var resp = await app.requestCloud(data);
        console.log(resp);
        // data = {
        //     type: 'rooms',
        //     opt: "findAll"
        // }
        // var roomsResp = await app.requestCloud(data);

        wx.hideLoading({
            success: (res) => {},
        })
        // console.log(roomsResp);
        // var rooms = roomsResp.result.data;
        // var roomMap = {};
        // var len = rooms.length;
        // for (var i = 0; i < len; i++) {
        //     roomMap[rooms[i]._id] = rooms[i];
        // }

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

        var courses = resp.result.data;
        if (courses && courses.length > 0) {
            var len = courses.length;
            var courseList = {};
            for (var i = 0; i < len; i++) {
                var course = courses[i];
                // var roomId = course.roomId;
                // course.room = roomMap[roomId];
                // var dutyerId = course.dutyerId;
                // if (dutyerId) {
                //     course.dutyer = this.data.userMap[dutyerId];
                // }
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
                        var aRoomName = a.roomName;
                        var bRoomName = b.roomName;
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
                    morningCourses: morning_list_more_sign,
                });
            }

            courseTabActive = Math.floor(coursesTemp.length / 2);

        }
        this.setData({
            courseList: coursesTemp,
            course_list_more_sign: course_list_more_sign,
            courseTabActive: courseTabActive,
            coursesTotels: coursesTotels
        });
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        var userInfo = app.globalData.userInfo;
        var semester = app.globalData.semester;
        var curWeek = app.globalData.curWeek;
        var maxWeek = app.globalData.maxWeek;
        var selectWeek = curWeek;
        this.setData({
            userInfo:userInfo,
            semester: semester,
            curWeek: curWeek,
            selectWeek: selectWeek,
            maxWeek: maxWeek
        });
        await this.requestWeekCourse();
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