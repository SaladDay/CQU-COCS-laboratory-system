// pages/semesterManage/add/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        minHour: 10,
        maxHour: 20,
        maxDate: new Date(2028, 10, 1).getTime(),
        startDate: new Date().getTime(),
        endDate: new Date().getTime(),
        filter:function(type, options) {
            if (type === 'minute') {
              return options.filter((option) => option % 5 === 0);
            }
            return options;
          },
        formatter(type, value) {
            if (type === 'year') {
              return `${value}年`;
            }
            if (type === 'month') {
              return `${value}月`;
            }
            if (type === 'day') {
                return `${value}日`;
            }
            if (type === 'hour') {
                return `${value}点`;
            }
            if (type === 'minute') {
                return `${value}分`;
            }
            
            return value;
          },
        _id:'',
        name: '',
        start: '',
        end: '',
        startShow: false,
        endShow: false,
        minDate: new Date(2020, 0, 1).getTime(),
    },

    onStartDisplay: function (e) {
        this.setData({
            startShow: true
        });
    },

    onStartClose() {
        this.setData({
            startShow: false
        });
    },

    formatDate(date) {
        date = new Date(date);
        return `${date.getFullYear() }-${date.getMonth() + 1}-${date.getDate()}`;
    },
    onStartConfirm(event) {
        this.setData({
            startShow: false,
            start: this.formatDate(event.detail),
        });
    },
    onEndDisplay: function (e) {
        this.setData({
            endShow: true
        });
    },

    onEndClose() {
        this.setData({
            endShow: false
        });
    },

    formatDate(date) {
        date = new Date(date);
        return `${date.getFullYear() }-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
    },
    onEndConfirm(event) {
        this.setData({
            endShow: false,
            end: this.formatDate(event.detail),
        });
    },

    onSubmit:async function(e){
        wx.showLoading({
          title: '请稍后...',
        })
        var name = this.data.name;
        var start = this.data.start;
        start = new Date(start).getTime();
        var end = this.data.end;
        end = new Date(end).getTime();

        var entity = {
            _id:this.data._id,
            name:name,
              start:start,
              end:end
        }
        var data = {
            type: 'registerCodeManage',
            opt: 'edit',
            entity:entity
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

    onNameChange:function(e){
        this.setData({
            name:e.detail
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        
        var data = JSON.parse(options.data);
        var startDate = new Date(data.start).getTime();
        var endDate = new Date(data.end).getTime();
        this.setData({
            name:data.name,
            start:data.start,
            startDate:startDate,
            end:data.end,
            endDate:endDate,
            _id:data._id
        });
        
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