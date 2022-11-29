const app = getApp();
// pages/equipTypeManage/equipTypeManage.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        title:'设备类型管理',
        modelName:'equipTypeManage',
        list:[],
        list_more_sign:[]

    },
    
    onAddClick:function(e){
        wx.navigateTo({
          url: 'add/index',
          success:(res)=>{
            console.log('跳转成功')
            console.log(res)

          },
          fail: function(res) {
            console.log('跳转失败')
            console.log(res)
          }
        })
    },

    onEditClick:function(e){
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        wx.navigateTo({
            url: '../'+this.data.modelName+'/edit/index?data='+JSON.stringify(data),
        })
    },
    //remove操作，已写
    onRemoveClick:async function(e){
        wx.showLoading({
          title: '请稍后...',
        })
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        var _id = data._id;
        data = {
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
    //从数据库中请求数据并刷新页面，已写
    refresh: async function(){
        var data  =  {
            type: 'equipTypeManage',
            opt: 'findAllEquipType'
          }
        var resp = await app.requestCloud(data);
        data = resp.result.data;
        // console.log(data)
        if(!data){
            return;
        }
        var len = data.length;
        var list_more_sign = [];

        for(var i = 0 ; i < len; i++){
            data[i].id = i;
            list_more_sign.push(false);
        }

        this.setData({
           list:data,
           list_more_sign:list_more_sign 
        });
      
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
        this.refresh();
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