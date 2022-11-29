// pages/semesterManage/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        title:"注册码管理",
        list:[],
        list_more_sign:[]
    },

    onAddClick:function(e){
        wx.navigateTo({
          url: '../registerManage/add/index',
        })
    },

    onEditClick:function(e){
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        wx.navigateTo({
            url: '../registerManage/edit/index?data='+JSON.stringify(data),
        })
    },

    onRemoveClick: async function(e){
        wx.showLoading({
          title: '请稍后...',
        })
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        var _id = data._id;
        var data = {
            type: 'registerCodeManage',
            opt: 'remove',
            _id:_id
          }

        await app.requestCloud(data);  
        wx.hideLoading({
            success: (res) => {
                this.refresh();
            },
          })
       
    },

    onMoreClick:function(e){
        var id= e.currentTarget.dataset.id;
        var list_more_sign = this.data.list_more_sign;
        var len = list_more_sign.length;
        for(var i = 0 ; i < len ; i++){
            if(i === id){
                list_more_sign[i] = !this.data.list_more_sign[i];
            }else{
                list_more_sign[i] = false;
            }
        }
        
        this.setData({
            list_more_sign:list_more_sign
        })
    },

    refresh: async function(){
        var  data = {
            type: 'registerCodeManage',
            opt: 'findAll'
        };
        var resp = await app.requestCloud(data);

        var data = resp.result.data;
        if(!data){
            return;
        }
        var len = data.length;
        var list_more_sign = [];
        for(var i = 0 ; i < len; i++){
            data[i].id = i;
            var end = data[i].end;
            var now = new Date().getTime();
            if(end < now){
                data[i].state = 0;
            }else{
                data[i].state = 1;
            }
            data[i].start = this.formatDate(data[i].start);
            data[i].end = this.formatDate(data[i].end);
            list_more_sign.push(false);
        }
        this.setData({
            list:data,
            list_more_sign:list_more_sign 
        });
        console.log(resp)
        
    },

    formatDate(date) {
        date = new Date(date);
        return `${date.getFullYear() }-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad:function (options) {
        
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow:  function () {
         this.refresh();
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