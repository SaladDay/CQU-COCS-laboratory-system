// pages/schedualQuery/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
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
    },

    onWeekChange: async function (e) {
        console.log(e.detail);
        var selectWeek = e.detail;
        this.setData({
          selectWeek: selectWeek
        });
        var active = this.data.active;
        await this.requestWeekScheduler();
      },

    requestWeekScheduler: async function (e) {
        var semester = app.globalData.semester;
        var  data = {
            type: 'schedulerManage',
            opt: "findbyWhere",
            where: {
              semesterId:semester._id,
              weekNum: this.data.selectWeek,
              finish:true
            }
          };
        var resp = await app.requestCloud(data);
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
        console.log(schedulers);
        this.setData({
          schedulerList: schedulers
        });
      },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function(options) {
        console.log("onLoad");
        var semester = app.globalData.semester;
        var curWeek = app.globalData.curWeek;
        var maxWeek = app.globalData.maxWeek;
        var selectWeek = curWeek;
        this.setData({
          semester: semester,
          curWeek: curWeek,
          selectWeek: selectWeek,
          maxWeek: maxWeek
        });
        console.log("onLoad");
        await this.requestWeekScheduler();
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