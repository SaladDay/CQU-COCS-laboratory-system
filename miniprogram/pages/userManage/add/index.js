// pages/semesterManage/add/index.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    type: 'userManage',
    maintain: true,
    scheduler:false
  },

  onMaintainChange: function (e) {
    this.setData({
      maintain: e.detail
    });
    console.log("onMaintainChange" + e.detail);
  },
  onSchedulerChange: function (e) {
    this.setData({
        scheduler: e.detail
    });
    console.log("onSchedulerChange" + e.detail);
  },
  onSubmit: async function (e) {
    wx.showLoading({
      title: '请稍后...',
    })
    var entity = {
      name: this.data.name,
      maintain: this.data.maintain,
      scheduler: this.data.scheduler
    }
    var data = {
        type: this.data.type,
        opt: 'add',
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

  onNameChange: function (e) {
    this.setData({
      name: e.detail
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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