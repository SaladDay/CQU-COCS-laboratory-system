// pages/semesterManage/add/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        // name: '',
        type: 'equipManage',
        equipTypeIndex: 0,
        show: false,
        roomShow: false,
        roomIndex: 0,
        amount:undefined
        
    },
    onAmountChange:function(e){
      this.setData({
        amount: e.detail
    });
    },
    onClose: function (e) {
        var type = e.currentTarget.dataset.id;
        if (type === "equipType") {
            this.setData({
                show: false
            });
        } else {
            this.setData({
                roomShow: false
            });
        }

    },

    onConfirm: function (e) {
        const {
            index
        } = e.detail;
        var type = e.currentTarget.dataset.id;
        if (type === "equipType") {
            this.setData({
                equipTypeIndex: index,
                show: false
            });
        } else {
            this.setData({
                roomIndex: index,
                roomShow: false
            });
        }
    },

    onDisplay: function (e) {
        const {
            index
        } = e.detail;
        var type = e.currentTarget.dataset.id;
        if (type === "equipType") {
            this.setData({
                show: true
            });
        } else {
            this.setData({
                roomShow: true
            });
        }
    },
    //设备编号
    onSubmit: async function (e) {
        /**检查输入是否合法 start*/
        this.data.amount=parseInt(this.data.amount)
        var isRightNumber = this.data.amount===+(this.data.amount)?(this.data.amount>0?true:false):false;
        if(isRightNumber===false){
        
          wx.showModal({
            title: '错误',
            content: '请输入正确的数量',
            showCancel:false
          })
          return 
        }
        /**检查输入是否合法 end */

        wx.showLoading({
            title: '请稍后...',
        })
        //查询此类型目前最大的数量  start
        var queryEntry = {
          equipTypeId:this.data.equipTypeIdList[this.data.equipTypeIndex],
        }
        var queryData = {
          type:this.data.type,
          opt:'querySum',
          entity:queryEntry
        }

        var res = await app.requestCloud(queryData);
        var existAmount = res.result.data
        console.log('res:')
        console.log(res)
      //查询此类型目前最大的数量  end
        for(let i =1;i<=this.data.amount;i++){
          var equipNameId =  this.data.equipTypeNameIdList[this.data.equipTypeIndex] + (Array(5).join('0')+(parseInt(existAmount)+i)).slice(-5)
          console.log('编号为')
          console.log(equipNameId)
          var entity = {
              roomId: this.data.roomIdList[this.data.roomIndex],
              equipTypeId:this.data.equipTypeIdList[this.data.equipTypeIndex],
              state:1,
              equipNameId:equipNameId,
              ord:existAmount+i

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
      }
    },

    // onNameChange: function (e) {
    //     this.setData({
    //         name: e.detail
    //     });
    // },

    // onRoomCodeChange: function (e) {
    //     this.setData({
    //         roomCode: e.detail
    //     });
    // },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
      //查询equipType数据
        var data = {
            type: "equipTypeManage",
            opt: 'findAll'
        }
        wx.showLoading({
          title:'加载中'
        });
        var resp = await app.requestCloud(data);
        var equipTypeData = resp.result.data;
        //equipData[{_id,name,nameId},{},{},{}]
        if(!equipTypeData){
          return
        }
        var equipTypeLen = equipTypeData.length;
        var equipTypeList = []
        var equipTypeNameIdList=[]
        var equipTypeIdList=[]
        for(var i = 0;i<equipTypeLen;i++){
          equipTypeList.push(equipTypeData[i].name)
          equipTypeNameIdList.push(equipTypeData[i].nameId)
          equipTypeIdList.push(equipTypeData[i]._id)

        }
        this.setData({
          equipTypeList:equipTypeList,
          equipTypeNameIdList:equipTypeNameIdList,
          equipTypeIdList:equipTypeIdList
        })
        //查询room数据
        var data = {
          type: "roomManage",
          opt: 'findAll'
      }
      var resp = await app.requestCloud(data);
      var roomData = resp.result.data;
      // console.log(roomData)
      // roomData:[{_id,name,roomCode(教室编号),managerId},{},{}]
      if(!roomData){
        return
      }
      var roomLen = roomData.length;
      var roomList = []
      var roomManagerIdList=[]
      var roomIdList=[]
      for(var i = 0;i<roomLen;i++){
        roomList.push(roomData[i].name)
        roomManagerIdList.push(roomData[i].managerId)
        roomIdList.push(roomData[i]._id)

      }
      this.setData({
        roomList:roomList,
        roomManagerIdList:roomManagerIdList,
        roomIdList:roomIdList
      })
      wx.hideLoading();


        // var data = resp.result.data;
        // if (!data) {
        //     return;
        // }
        // var len = data.length;
        // var userList = [];
        // var schedulerList = [];
        // var _idList = [];
        // var schedulerIdList = [];

        // for (var i = 0; i < len; i++) {
        //     var user = data[i];
        //     var _id = user._id;
        //     userList.push(user.name);
        //     _idList.push(_id);

        //     if (user.scheduler) {
        //         schedulerIdList.push(_id);
        //         schedulerList.push(user.name);
        //     }
        // }
        
        // this.setData({
        //     _idList: _idList,
        //     userList: userList,
        //     schedulerList: schedulerList,
        //     schedulerIdList: schedulerIdList,
        // });

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