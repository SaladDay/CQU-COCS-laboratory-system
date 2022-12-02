// pages/equipRepair/equipRepair.js
const app = getApp();
import {moment} from '../../utils/moment';
Page({

    /**
     * 页面的初始数据
     */
    data: {
        userInfo:app.globalData.userInfo,
        roomIndex:undefined,
        fileList:[],
        pickerListRoom:[],
        pickerListEquip:[{equipNameId:'请先选择机房和设备类型'}],
        pickerListEquipType:[],
        description:'',
        max:200,
        currentWordNumber:0

    },
    
    bindSubmitData:function(e){
        var equipInfo = this.data.pickerListEquip[this.data.equipIndex];
        var equipRoomInfo = this.data.pickerListRoom[this.data.roomIndex];
        var fileList = this.data.fileList.map((res)=>{return {url:res.url}});
        var creatTime = moment('YYYY-MM-DD hh:mm:ss');
        console.log('fileList:::')
        console.log(creatTime)
        var data = {
            userInfo:this.data.userInfo,
            equipInfo:equipInfo,
            equipRoomInfo:equipRoomInfo,
            content:this.data.description,
            fileList:fileList,
            creatDate:creatTime,
            state:0


        }
        var roomManager = this.data.pickerListRoom[this.data.roomIndex].manager.name
        var subMsg={
            'thing1':{
                'value':this.data.userInfo.name
            },
            'thing3':{
                'value':this.data.pickerListEquip[this.data.equipIndex].equipNameId
            },
            'thing7':{
                'value':roomManager
            },
            'phrase9':{
                'value':'加急维修中'
            }

        }
        wx.requestSubscribeMessage({
          tmplIds: ['Drfsf5gkl1z44LFmseopAbzksiGBdLiGeJVfs9Ls3DE'],
          success:(res)=>{
              if(this.validate()){
                wx.showLoading({
                    title: '正在提交...',
                    mask: true
                  })
                app.requestCloud({
                    type:'equipRepairManage',
                    opt:'add',
                    entity:data
                }).then((res)=>{
                    console.log(res)
                    if(res.errMsg === "cloud.callFunction:ok"){
                        wx.hideLoading({
                          success: (res) => {},
                        })
                        wx.showModal({
                            title:'',
                            content:'提交成功',
                            showCancel:false,
                            success:(res)=>{
                               app.requestCloud({
                                   type:'subscribe',
                                   opt:'subscribe',
                                   entity:subMsg
                               }).then(res=>{
                                    console.log('推送成功')
                                    console.log(res)
                                }).catch(res=>{
                                    console.log('推送失败')
                                    console.log(res)
                                })



                                wx.reLaunch({
                                    url: '../index/index?id=success',
                                  })
                            }
                        })
                        
                    }
                }).catch(err=>{
                    console.log(err)
                })
              }
          }
        })
    },
    validate:function(){
        if(this.data.equipIndex===undefined||this.data.roomIndex===undefined){
            wx.showToast({
                title: '请填写故障机器',
                icon: 'error',
                duration: 500
            })
            return false; 
        }else if(this.data.pickerListEquip[this.data.equipIndex].equipNameId === '本房间暂无机器'){
            wx.showToast({
                title: '此房间没有机器',
                icon: 'error',
                duration: 500
            })
            return false; 
        }
        if(this.data.description === '' || this.data.description===undefined){
            wx.showToast({
                title: '请说明故障具体情况',
                icon: 'error',
                duration: 500
            })
            return false; 
        }
        return true;
    },

    setDesc:function(e){

        var description = e.detail.value
        this.data.description = description;
        this.setData({
            currentWordNumber:description.length
        })
        console.log(this.data.description)
    },
    selectEquipType:function(e){
        console.log(e)

        if(this.data.roomIndex===undefined){
            wx.showToast({
              title: '请先选择机房',
              icon:'error'
            })
        }else{
            this.setData({
                equipTypeIndex:e.detail.value
            })

            wx.showLoading({
                title: '加载中',
                mask:true
              })
              var roomId = this.data.pickerListRoom[this.data.roomIndex]._id;
              var equipTypeId = this.data.pickerListEquipType[this.data.equipTypeIndex]._id
              
              var  data = {
                  type: 'equipRepair',
                  opt: 'searchEquipByRoomAndEquipType',
                  entity:{
                      roomId:roomId,
                      equipTypeId:equipTypeId
                  }
                }
              app.requestCloud(data).then((res)=>{
                  console.log(res)
                  var pickerListEquip = res.result.data;
                  if(pickerListEquip.length != 0){
                      this.setData({
                          pickerListEquip:pickerListEquip
                      })
                  }else{
                      var emptyObject={
                          equipNameId:'本房间暂无机器'
                      }
                      pickerListEquip.push(emptyObject)
                      this.setData({
                          pickerListEquip:pickerListEquip
                      })
                  }
                  wx.hideLoading({
                    success: (res) => {},
                  })
              })
        }
    },
  
    selectRoom:function(e){
        console.log('用户点击确认')
        this.setData({
            roomIndex:e.detail.value
        })
       
        
      
        // console.log(resp)

    },
    selectEquip:function(e){
        this.setData({
            equipIndex:e.detail.value
        })
    },
  
    afterRead:function( event) {
    const file = event.detail.file 
    
    //还没上传时将选择的图片的上传状态设置为加载    
    var that = this
    const fileList = that.data.fileList 
    fileList.push({})
    fileList[ fileList.length-1 ].status='uploading'
    that.setData({ fileList })

    this.uploadImg( file.url )
  },

 // 上传图片到云开发的存储中
  uploadImg( fileURL) {
    var that = this
    //上传文件
    const filePath = fileURL // 小程序临时文件路径
    const cloudPath = 'equipRepairPhoto/'+`${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}` + filePath.match(/\.[^.]+?$/)[0]
    // 给文件名加上时间戳和一个随机数，时间戳是以毫秒计算，而随机数是以 1000 内的正整数，除非 1 秒钟（1 秒=1000 毫秒）上传几十万张照片，不然文件名是不会重复的。
    // 将图片上传至云存储空间
    wx.cloud.uploadFile({
      cloudPath, // 指定上传到的云路径
      filePath // 指定要上传的文件的小程序临时文件路径
    }).then(res => {
      // 上传一张图片就会打印上传成功之后的 res 对象，里面包含图片在云存储里的 fileID，注意它的文件名和文件后缀
      console.log("res.fileID", res.fileID)
      // 上传完成需要更新 fileList
      const fileList = that.data.fileList 
      fileList[ fileList.length-1 ].url = res.fileID
      fileList[ fileList.length-1 ].status='done' //将上传状态修改为已完成
      that.setData({ fileList })
      console.log("fileList", fileList)
      wx.showToast({ title: '上传成功', icon: 'none' })
    }).catch((e) => {
      wx.showToast({ title: '上传失败', icon: 'none' })
      const fileList = that.data.fileList 
      fileList[ fileList.length-1 ].status='failed' //将上传状态修改为已完成
      that.setData({ fileList })
      console.log(e)
    });
  },

  // 点击预览的x号，将图片删除
  deleteImg( event) {
    // event.detail.index: 删除图片的序号值
    const that  = this;
    const delIndex = event.detail.index
	const fileList = that.data.fileList 
	
    // 云存储删除（真删除）
    var fileID = fileList[ delIndex].url
    this.deleteCloudImg( fileID)
    
    // 页面删除（假删除）
    // 添加或删除 array.splice(index,howmany,item1,.....,itemX)
    fileList.splice( delIndex, 1)
    this.setData({ fileList })
  },

  // 删除云存储的图片
  deleteCloudImg( fileID) {
    wx.cloud.deleteFile({
      fileList: [ fileID],
    }).then(res => {
      // handle success
      console.log(res.fileList)
    }).catch((e) => {
      wx.showToast({ title: '删除失败', icon: 'none' })
      console.log(e)
    })
  },



  refresh: async function(){
    wx.showLoading({
    title: '加载中',
    mask:true
    })
    var data  =  {
        type: 'roomManage',
        opt: 'findAllRoom'
      }
    var resp = await app.requestCloud(data);
    data = resp.result.data;
    if(!data){
        return;
    }
    var len = data.length;
    for(var i = 0 ; i < len; i++){
        data[i].id = i;
        if(data[i].manager.length > 0){
          data[i].manager = data[i].manager[0];
        }
        if(data[i].scheduler.length > 0){
            data[i].scheduler = data[i].scheduler[0];
          }
    }


    var sendData  =  {
        type: 'equipTypeManage',
        opt: 'findAllEquipType'
      }
    var resp = await app.requestCloud(sendData);
    var equipTypeData = resp.result.data;
    // console.log(data)
    if(!equipTypeData){
        return;
    }
    var len = equipTypeData.length;

    for(var i = 0 ; i < len; i++){
        equipTypeData[i].id = i;
    }
    




 

    this.setData({
        pickerListEquipType:equipTypeData,        
        pickerListRoom:data,
    });
    wx.hideLoading({
      success: (res) => {},
    })
  
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