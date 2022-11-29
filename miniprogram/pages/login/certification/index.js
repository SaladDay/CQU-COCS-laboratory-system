var app = getApp();
// pages/index/certification/index.js
Page({

    /**
     * 页面的初始数据
     */
    data: {

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
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

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