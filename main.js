
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , ejs = require("ejs") //동적인 html 생성모듈
  , fs = require("fs") //파일을 읽어들이는 내부모듈
  , bodyParser = require("body-parser")
  , oracledb = require('/Users/bhuanchanwoo/workspace_projectL/node2oracle/node_modules/oracledb')
  , dbconfig = require('/Users/bhuanchanwoo/workspace_projectL/node2oracle/dbconfig');
oracledb.autoCommit = true;

//오라클 접속
var conn;
oracledb.getConnection({
  user          : "hello",
  password      : "world",
  connectString : "127.0.0.1/orcl"
},function(err,con){
  if(err){
      console.log("접속이 실패했습니다.",err);
  }
  conn = con;
});

// all environments
var app = express();
app.set('port', process.env.PORT || 3000);
//app.set('public', __dirname + '/public');
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static('public'));
//app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:true}));



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
app.get('/', routes.index);
app.get('/users', user.list);


var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//node-oracle test
//클라이언트로부터 regist를 요청받으면
app.post("/regist",function(request, response){
    console.log(request.body);
    //오라클에 접속해서 insert문을 실행한다. 
    var writer = request.body.writer;
    var title = request.body.title;
    var content = request.body.content;

        //쿼리문 실행 
        conn.execute("insert into notice(notice_id,writer,title,content) values(seq_notice.nextval,'"+writer+"','"+title+"','"+content+"')",function(err,result){
            if(err){
                console.log("등록중 에러가 발생했어요!!", err);
                response.writeHead(500, {"ContentType":"text/html"});
                response.end("fail!!");
            }else{
                console.log("result : ",result);
                response.writeHead(200, {"ContentType":"text/html"});
                response.end("success!!");
            }
        });
    });



//클라이언트로부터 list를 요청받으면 
app.get("/list",function(request,response){
    var total = 0;

    //페이징 처리 기법
    var currentPage = 1; //현재 보고 있는 페이지
    //사용자가 링크를 누른경우에는 넘어온 currentPage 값으로 대체해야한다.
    if(request.query.currentPage != undefined){
        currentPage = parseInt(request.query.currentPage);
    }
    var totalRecord = 0;
    conn.execute("select * from notice order by notice_id desc", function(err,result, fields){
        //field는 칼럼
        if(err){
            console.log("조회 실패");
        }

        totalRecord = result.rows.length;
        var pageSize = 10; //페이지당 보여질 레코드 수
        var totalPage=Math.ceil(totalRecord/pageSize); //전체페이지수
        var blockSize = 10; //블럭당 보여질 페이지 수
        var firstPage = currentPage-(currentPage-1)%blockSize; //블럭당 시작 페이지
        var lastPage= firstPage + blockSize - 1; //블럭당 마지막 페이지
        var num = totalRecord - (currentPage-1)*pageSize; //페이지당 시작 게시물 갯수 번호

        //ejs를 읽어야 함.
        fs.readFile("list.ejs","utf-8",function(error, data){
            if(error){
                console.log("읽기 실패");
            }
            response.writeHead(200,{"Content-Type":"text/html"});
            response.end(ejs.render(data,{
                currentPage:currentPage,
                totalRecord:totalRecord,
                pageSize:pageSize,
                totalPage:totalPage,
                blockSize:blockSize,
                firstPage:firstPage,
                lastPage:lastPage,
                num : num
            } )); //data를 해석
        });
    });

});