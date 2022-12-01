// pages/semesterManage/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        userPermisstion:{},
        active:0,
        
        

    },
    onChange:function(e){
        this.setData({
            active:e.detail.index
        })
        this.refresh();
    },
    toSolve:function(e){
        var id= e.currentTarget.dataset.id;
        var data = this.data.equipRepairList[id];
        wx.navigateTo({
            url: '/pages/allEquipRepair/solve/solve?data='+JSON.stringify(data),
        })
    },

    escUp:function(e){
        wx.redirectTo({
          url: '/pages/index/index',
        })
    },

    onAddClick:function(e){
        wx.navigateTo({
          url: '../'+this.data.modelName+'/add/index',
        })
    },

    onAllClick:function(e){
        var id= e.currentTarget.dataset.id;
        var data = this.data.equipRepairList[id];
        wx.navigateTo({
            url: '../allEquipRepair/all/all?data='+JSON.stringify(data),
        })
    },

    onRemoveClick:async function(e){
        wx.showModal({
            title:'确认删除',
            success:(res)=>{
                if(res.confirm){
                    var id= e.currentTarget.dataset.id;
                      var data = this.data.equipRepairList[id];
                      var _id = data._id;
                      data = {
                          type: 'equipRepairManage',
                          opt: 'remove',
                          _id:_id
                        }
                      app.requestCloud(data).then(()=>{
                            wx.showToast({
                                title: '删除成功',
                                duration:2000,
                                success:()=>{
                                    this.refresh();
                                }
                          })
                        })
                      
                }            
            }
        })
        
    },

    onScanClick:async function(e){
        
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        var _id = data._id;

        // wx.navigateTo({
        //   url: '/pages/contact/index?scene='+_id,
        // })

        data = {
            type: this.data.modelName,
            opt: 'createRoomCode',
            roomId:_id
        }
        var resp = await app.requestCloud(data);
        console.log(resp);
        var result = resp.result.data;
        var list = this.data.list;
        list[id].contactCodeImg = result;
        this.setData({
            list:list
        })
        app.hideLoading();
    },

    onMoreClick:function(e){
        console.log(e)
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
        if(!(this.data.userPermisstion.userType===0))return;
        wx.showLoading({
          title: '加载中',
        })
        var data  =  {
            type: 'equipRepairManager',
            opt: 'findAllEquipRepair',
            state:this.data.active
          }
        var resp = await app.requestCloud(data);
        data = resp.result.data;
        if(!data){
            return;
        }
        var len = data.length;
        var equipRepairList =[];
        var list_more_sign=[];
        for(var i = 0 ; i < len; i++){
            var id = i;
            var _id = data[i]._id;//报修单id
            var equipId = data[i].equipInfo.equipNameId;
            var equipRoom = data[i].equipRoomInfo.name;
            var equipContent = data[i].content;
            var equipRoomManagerName = data[i].equipRoomInfo.manager.name;
            // var equipRoomManagerPhone = data[i].equipRoomInfo.manager.phone;
            var state = data[i].state;
            var equipRepairDescription = data[i].content;
            var creatDate = data[i].creatDate;
            var fileList = data[i].fileList;
            var repairDate = data[i].repairDate === undefined?'暂无':data[i].repairDate;
            var feedback = data[i].feedback;
            list_more_sign.push(false)
            equipRepairList.push({
                id,_id,equipId,equipRoom,equipRoomManagerName,equipRepairDescription,creatDate,repairDate,fileList,equipContent,state,feedback
            })

        }

        this.setData({
            equipRepairList:equipRepairList,
            list_more_sign:list_more_sign,

        });
        wx.hideLoading({
            success: (res) => {},
          })
      
    },

    formatDate:function(time){
        var date = new Date(time);
        return ""+date.getFullYear()+"-"+(date.getMonth()+1)+"-"+(date.getDate()) 
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad:function (options) {
        // console.log(app.globalData)
        var userPermisstion = {}
        userPermisstion.userType = app.globalData.userInfo.userType,
        userPermisstion.manager = app.globalData.userInfo.manager,
        userPermisstion.scheduler = app.globalData.userInfo.scheduler;
        this.data.userPermisstion = userPermisstion;
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