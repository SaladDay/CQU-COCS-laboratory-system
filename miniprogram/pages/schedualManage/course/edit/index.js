// pages/semesterManage/add/index.js
var app = getApp();
import Dialog from '../../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

    /**
     * 页面的初始数据
     */
    data: {
        name: '',
        type: 'ruleManage',
        weekDayList: [{
                values: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
                className: '星期',
                defaultIndex: 0,
            },
            {
                values: ['上午', '下午', '晚上'],
                className: '时间',
                defaultIndex: 1,
            },
        ],
        weekList: [{
                text: '星期一',
                value: 1
            }, {
                text: '星期二',
                value: 2
            }, {
                text: '星期三',
                value: 3
            },
            {
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
            }
        ],

        weekNum: 1,
        weekDay: 1,
        startPeriod: 1,
        endPeriod: 4,
        minPeriod:1,
        maxPeriod:13,

        roomIndex: 0,
        roomShow: false,

        dutyerIndex: 0,
        dutyerShow: false
    },

    onStepperChange: function (e) {
        var id = e.currentTarget.id;
        var index = e.detail;
        var data = {};
        data[id] = index;

        if (id === "startPeriod"){
            if(index > this.data.endPeriod){
                data["endPeriod"] = index;
            }

            if(index > 4 && index < 10){
                if(this.data.endPeriod > 9){
                    data["endPeriod"] = 9;
                }
            }
            else if(index > 9){
                if(this.data.endPeriod < 10){
                    data["endPeriod"] = 13;
                }
            }else{
                if(this.data.endPeriod > 4){
                    data["endPeriod"] = 4;
                }
            }
            
        }
        if (id === "endPeriod") {
            if(index < this.data.startPeriod){
                data["startPeriod"] = index;
            }
            if(index > 4 && index < 10){
                if(this.data.startPeriod < 5){
                    data["startPeriod"] = 5;
                }
            }
            else if(index > 9){
                if(this.data.startPeriod < 10){
                    data["startPeriod"] = 10;
                }
            }else{
                if(this.data.startPeriod > 4){
                    data["startPeriod"] = 1;
                }
            }
        }

        this.setData(data);
    },

    onPickerCancel: function (e) {
        var id = e.currentTarget.dataset.id;
        if (id === 'room') {
            this.setData({
                roomShow: false
            });
        } else {
            this.setData({
                dutyerShow: false
            });
        }
    },

    onPickerConfirm: function (e) {
        const {
            index
        } = e.detail;
        var id = e.currentTarget.dataset.id;
        if (id === 'room') {
            this.setData({
                roomIndex: index,
                roomShow: false
            });
        } else {
            this.setData({
                dutyerIndex: index,
                dutyerShow: false
            });
        }
    },

    onPickerDisplay: function (e) {
        console.log(e)
        var id = e.currentTarget.dataset.id;
        if (id === 'room') {
            this.setData({
                roomShow: true
            });
        } else {
            this.setData({
                dutyerShow: true
            });
        }
    },

    onSubmit: async function (e) {
        wx.showLoading({
            title: '请稍后...',
        })
        var semester = app.globalData.semester;
        var userInfo = app.globalData.userInfo;
        var entity = {
            _id: this.data._id,
            courseName: this.data.courseName,
            instructorName: this.data.instructorName,
            selectedStuNum: this.data.selectedStuNum,
            semesterId: semester._id,
            weekNum: this.data.weekNum,
            weekDay: this.data.weekDay,
            startPeriod: this.data.startPeriod,
            endPeriod: this.data.endPeriod,
            roomId: this.data.roomIdList[this.data.roomIndex],
            roomName: this.data.roomList[this.data.roomIndex],
            type: this.data.type,
            instructorId:this.data.instructorId,
        }

        if (this.data.schedulerTotal > 0) {
            entity.dutyerId = this.data.userIdList[this.data.dutyerIndex];
            entity.schedulerId = userInfo._id;
        }

        var data = {
            type: "schedulerManage",
            opt: 'editCourseAndScheduler',
            entity: entity
        }
        await app.requestCloud(data);
        wx.hideLoading({
            success: (res) => {
                wx.navigateBack({
                    delta: 1
                })
            },
        })
    },

    requestUserList: async function () {
        app.showLoading("加载用户...")
        var semester = app.globalData.semester;
        var data = {
            type: "schedulerManage",
            opt: 'findUserListNoSchedulerComplict',
            weekDay: this.data.weekDay,
            weekNum: this.data.weekNum,
            semesterId: semester._id
        }
        var resp = await app.requestCloud(data);
        app.hideLoading();
        var data = resp.result.data;
        if (!data) {
            return;
        }
        var len = data.length;
        var userList = [];
        var userIdList = [];
        var user = null;
        for (var i = 0; i < len; i++) {

            user = data[i];
            var dutyer = {}
            if (user.conflict === 1) {
                dutyer.text = user.name + "(冲突:" + this.data.userMap[user.conflictSchedulerId[0]].name + ")";
                dutyer.disabled = true;
            } else {
                dutyer.text = user.name;
            }
            userList.push(dutyer);
            userIdList.push(user._id);

        }

        this.setData({
            userIdList: userIdList,
            userList: userList,
        });
        console.log(resp)
    },
    init_cloud: async function () {
        await this.requestIsScheduled();
        await this.requestUserList();
        var schedulerTotal = this.data.schedulerTotal;
        if (schedulerTotal > 0) {
            await this.requestSchedulerByCourseId();
        }
        await this.requestRoomsByCourse();
    },

    requestSchedulerByCourseId: async function () {
        app.showLoading("加载课程排班数据");
        var courseId = this.data._id;
        var where = {
            courseId: courseId
        };
        var data = {
            type: "schedulerManage",
            opt: 'findbyWhere',
            where: where
        }

        var resp = await app.requestCloud(data);
        app.hideLoading();
        var schedulerList = resp.result.data;
        if (schedulerList.length > 0) {
            var dutyerId = schedulerList[0].dutyerId;
            var userIdList = this.data.userIdList;
            var dutyerIndex = userIdList.indexOf(dutyerId);

            this.setData({
                dutyerIndex: dutyerIndex,
                scheduler: schedulerList[0]
            });
        }
        console.log(resp);
    },

    requestRoomsByCourse: async function () {
        app.showLoading("加载教室...")
        this.setData({
            loading: true
        });
        var semester = app.globalData.semester;
        var entity = {
            weekNum: this.data.weekNum,
            weekDay: this.data.weekDay,
            startPeriod: this.data.startPeriod,
            endPeriod: this.data.endPeriod,
            semesterId: semester._id
        }
        var data = {
            type: "schedulerManage",
            opt: 'findRoomByPeriod',
            entity: entity
        }
        var resp = await app.requestCloud(data);
        app.hideLoading();
        console.log(resp);
        var rooms = resp.result.data;
        if(!rooms){
            rooms = [];
        }
        var length = rooms.length;
        console.log(rooms);
        rooms.push(this.data.room);
        rooms.sort(function (a, b) {
            var aRoomName = a.name;
            var bRoomName = b.name;
            if (aRoomName < bRoomName) {
                return -1;
            }
            if (aRoomName > bRoomName) {
                return 1;
            }
            return 0;
        });

        var roomList = [];
        var roomIdList = [];
        console.log(rooms);
        console.log(length);
        length = rooms.length;
        for (var i = 0; i < length; i++) {
            var room = rooms[i];
            roomList.push(room.name);
            roomIdList.push(room._id);
        }
        var roomIndex = roomIdList.indexOf(this.data.roomId);
        console.log(roomList)
        this.setData({
            roomList: roomList,
            roomIndex: roomIndex,
            roomIdList: roomIdList,
            loading: false
        });
    },

    /**
     * 是否已经排班
     */
    requestIsScheduled: async function () {
        app.showLoading("检测是否已经排班...")
        var semester = app.globalData.semester;
        var data = {
            type: "schedulerManage",
            opt: 'findSchedulerTotelByWeekNum',
            weekNum: this.data.weekNum,
            semesterId: semester._id
        }
        var resp = await app.requestCloud(data);
        console.log(resp);
        var total = resp.result.data.total;
        this.setData({
            schedulerTotal: total
        });
        app.hideLoading();
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

        var data = JSON.parse(options.data);
        var userMap = data.userMap;
        var course = data.course;
        var selectWeek = data.selectWeek;
        data.weekNum = selectWeek;
        // var morning = data.course.morning;
        // if(morning === 1){
        //     data.minPeriod = 1;
        //     data.maxPeriod = 4;
        // }else if(morning === 2){
        //     data.minPeriod = 5;
        //     data.maxPeriod = 9;
        // }else{
        //     data.minPeriod = 10;
        //     data.maxPeriod = 13;
        // }
        

        this.setData(data);
        this.setData(course);
        this.init_cloud();

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