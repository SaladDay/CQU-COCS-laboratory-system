
// pages/semesterManage/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        title:"设备管理",
        userTypeList:['实验人员','学生','教师'],
        modelName:'equipManage',
        maxNum:5,
        pageNum:1,
        list:[],
        keyword:'',
        list_more_sign:[]
    },

    onClickLoadingHide:function(e){
        this.setData({
            loadingShow:false
        });
    },

    onScrollRefresh:async function(e){
        console.log(e)
        this.setData({
            loadingShow:true,
            pageNum:this.data.pageNum+1
        });
        var data = await this.requestEquipByPage();
        if(!data){
            return;
        }
        console.log(data)
        if(data.length === 0){
            this.setData({
                loadingShow:false
            });
            wx.showToast({
                title: '已最后一页！',
                icon: 'success',
                duration: 2000
            })
            return;
        }
        var list = this.data.list;
        var len = data.length;
        var list_more_sign = this.data.list_more_sign;
        
        var listLen = list.length;
        for(var i = 0 ; i < len; i++){
            data[i].id = listLen + i;
            data[i].name = data[i].equipType[0].name +"--"+data[i].equipNameId.substring(5,10);
            list_more_sign.push(false);
        }
        list = list.concat(data)
        this.setData({
           list:list,
           list_more_sign:list_more_sign 
        });
        this.setData({
            loadingShow:false
        });
    },

    onCancel:function(){
        this.setData({
            keyword:''
        });
        this.refresh();
    },
    onChange:function(e){
        var keyword = e.detail;
        this.setData({
            keyword:keyword
        });
    },
    onSearch:async function(e){
        console.log("关键字："+e.detail);
        var keyword = e.detail;
        this.setData({
            keyword:keyword
        });
        var  data = {
            type: this.data.modelName,
            opt: 'requestByEquipNameId',
            keyword:keyword
        }
       var resp = await app.requestCloud(data);
       var data = resp.result.data;
       
        var len = data.length;
        var list_more_sign = [];
        for(var i = 0 ; i < len; i++){
            data[i].id = i;
            list_more_sign.push(false);
            data[i].name = data[i].equipType[0].name+'--'+data[i].equipNameId.substring(5,10)
        }
        this.setData({
        list:data,
        list_more_sign:list_more_sign 
        });
       console.log(data)
    },

    onAddClick:function(e){
        wx.navigateTo({
          url: '../'+this.data.modelName+'/add/index',
        })
    },

    onEditClick:function(e){
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        wx.navigateTo({
            url: '../'+this.data.modelName+'/edit/index?data='+JSON.stringify(data),
        })
    },

    onRemoveClick: async function(e){
        wx.showLoading({
          title: '请稍后...',
        })
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        var _id = data._id;
        var  data = {
            type: this.data.modelName,
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

    // requestUserByPage:async function(){
    //     var  data = {
    //         type: this.data.modelName,
    //         opt: 'findByPage',
    //         pageNum:this.data.pageNum,
    //         maxNum:this.data.maxNum
    //     }
    //     var resp = await app.requestCloud(data);
    //     return resp.result.data;
    // },
    //按页获取设备信息
    requestEquipByPage:async function(){
        var data={
            type:this.data.modelName,
            opt:'findEquipByPage',
            pageNum:this.data.pageNum,
            maxNum:this.data.maxNum
        }
        var resp = await app.requestCloud(data);
        console.log('resp：')
        console.log(resp)
        return resp.result.data;

    },

    refresh:async function(){
        this.setData({
            pageNum:1
        })
        // var data = await this.requestUserByPage();
        var data = await this.requestEquipByPage();
        if(!data){
            return;
        }
        var len = data.length;
        var list_more_sign = [];
        for(var i = 0 ; i < len; i++){
            data[i].id = i;
            data[i].name = data[i].equipType[0].name +"--"+data[i].equipNameId.substring(5,10);
            list_more_sign.push(false);
        }
        this.setData({
           list:data,
           list_more_sign:list_more_sign 
        });
        
    },

    // formatDate:function(time){
    //     var date = new Date(time);
    //     return ""+date.getFullYear()+"-"+(date.getMonth()+1)+"-"+(date.getDate()) 
    // },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad:function (options) {
        const windowInfo = wx.getSystemInfoSync();
        console.log(windowInfo)
        const height = windowInfo.windowHeight;
        this.setData({
            scrollHeight:height
        })
        console.log(windowInfo.pixelRatio)
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