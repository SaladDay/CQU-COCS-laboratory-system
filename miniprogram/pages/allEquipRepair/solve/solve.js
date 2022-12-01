// pages/myEquipRepair/all/all.js
const app = getApp();
import {moment} from '../../../utils/moment';
Page({

    /**
     * 页面的初始数据
     */
    data: {
        // tabList: [{
        //     name: '当前未处理',
        //     status: '未处理'
        //   }, {
        //     name: '当前已处理',
        //     status: '已处理'
        //   }],
          feedback:''
    },
    onSubmit:function(){
        
        var repairTime = moment('YYYY-MM-DD hh:mm:ss');
        var updateData = {
            equipRepairId : this.data._id,
            repairTime:repairTime,
            feedback:this.data.feedback
        }
        var data = {
            type: 'equipRepairManage',
            opt: 'updateEquipRepair',
            updateData:updateData
        }
        app.requestCloud(data).then(res=>{
            console.log(res)
            if(res.errMsg==='cloud.callFunction:ok'){

                wx.showToast({
                  title: '提交成功',
                  duration:2000
                })
                setTimeout(function(){
                    wx.navigateTo({
                        url:'/pages/index/index'
                    })
                },2000)
            }else(
                wx.showToast({
                    title: '提交失败,请重试',
                    duration:2000
                  })
                  
            )

        })

    },

    onIsAddChange: function (e) {
        this.setData({
            isAdd: e.detail
        });
        console.log("isAdd" + e.detail);
      },
    previewImage:function(e){
        var current = e.currentTarget.dataset.src;
        console.log(current);
        var fileList = this.data.fileList.map((item)=>{return item.url});
        wx.previewImage({
            current: current, // 当前显示图片的http链接
            urls: fileList, // 需要预览的图片http链接列表
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // console.log(options.data)
        var data = JSON.parse(options.data);
        this.setData({
            creatDate:data.creatDate,
            equipId:data.equipId,
            equipRepairDescription:data.equipRepairDescription,
            equipRoom:data.equipRoom,
            equipRoomManagerName:data.equipRoomManagerName,
            fileList:data.fileList,
            repairTime:data.repairTime,
            equipContent:data.equipContent,
            _id:data._id,
            state:data.state
        })
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