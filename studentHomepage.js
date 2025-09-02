import React from "react";
import { connect } from "react-redux";
import LogoutButton from "../../atoms/LogoutButton/LogoutButton.js";
import Auth from "../../../helper/Auth.js";
import { Navigate } from "react-router-dom";
import { getUserDetails } from "../../../redux/actions/loginAction.js";
import { Drawer, Typography, withStyles, AppBar, Toolbar, List, ListItem, ListItemText } from "@material-ui/core";
import AlertBox from '../../atoms/Alertbox/AlertBox.js';
import TestDetailsStudent from "../../templates/TestDetails/TestDetailsStudent.js";
import UpcomingStudentTestsDetails from "../../templates/TestDetails/UpcomingStudentTestsDetails.js";
import CompletedTestsDetailsStudent from "../../templates/TestDetails/CompletedTestsDetailsStudent.js";
import BOT from "./Bot.js";

const drawerWidth = 200
const appbarHeight = 64

const useStyles = (theme)=>({
  drawer : {
    width : drawerWidth,
    height : `calc(100% - ${appbarHeight}px)`,
    top : appbarHeight
  },
  drawerPaper : {
    width : drawerWidth,
    height : `calc(100% - ${appbarHeight}px)`,
    top : appbarHeight
  },
  flex : {
    display : 'flex'
  },
  content : {
    margin:'auto'
  },
  addHeight : theme.mixins.toolbar,
  title : {
    flexGrow : 1
  },
  appbar : {
    height : appbarHeight
  },
  listItem: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: 'black', 
    },
  },
  activeListItem: {
    backgroundColor: '#3f51b5', // Change this to your desired active color
    color: 'white', 
  },
})

class StudentHomepage extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      content:(<div>Welcome to Exam portal</div>),
      selectedIndex: 0, 
      menuList:[{
        title:'Home',
        content:(<div>Welcome to Exam portal</div>),
      },{
        title: 'BOT',
        content: <BOT />,
      },
      {
        title : 'View All tests',
        content:<TestDetailsStudent/>
      },{
        title : 'Upcoming Tests',
        content:<UpcomingStudentTestsDetails/>
      },{
        title : 'Completed Tests',
        content : <CompletedTestsDetailsStudent/>
      }]
    }
  }

  onMenuItemClick(index ,content) {
    this.setState({
      // ...this.state,
      selectedIndex: index,
      content: content
    })
  }

  render(){
    if(!Auth.retriveToken() || Auth.retriveToken()==='undefined'){
      return (<Navigate to='/'/>);
    } else if(!this.props.user.isLoggedIn) {
      this.props.getUserDetails();
      return (<div></div>);
    } else if(this.props.user.userDetails.type !== 'STUDENT') {
      return (<Navigate to='/'/>);
    }
    return(
      <div>
        <div>
          <AppBar
            elevation={0}
            className={this.props.classes.appbar}
          >
            <Toolbar>
              <Typography variant='h5' className={this.props.classes.title}>
                Student Homepage
              </Typography>
              <Typography variant='h6'>
                welcome, {this.props.user.userDetails.username} !!
              </Typography>
            </Toolbar>
          </AppBar>
          <div className={this.props.classes.addHeight}></div>
        </div>
        <div className={this.props.classes.flex}>
          <Drawer
            className={this.props.classes.drawer}
            variant="permanent"
            anchor="left"
            classes= { {paper:this.props.classes.drawerPaper}}
          >
            <List>
              {this.state.menuList.map((item,index)=>(
                <ListItem button key={index} onClick={()=>(this.onMenuItemClick(index, item.content))} className={
                  index === this.state.selectedIndex
                    ? `${this.props.classes.listItem} ${this.props.classes.activeListItem}`
                    : this.props.classes.listItem
                }
                 >
                  <ListItemText primary={item.title}/>
                </ListItem>
              ))}
              <ListItem>
              <LogoutButton/>
              </ListItem>
            </List>
          </Drawer>
          <div className={this.props.classes.content}>
            
          <AlertBox></AlertBox>
          {this.state.content}
            
          </div>
        </div>
      </div>
    )
  }
}

const mapStatetoProps = state => ({
  user:state.user
})

export default withStyles(useStyles)(connect(mapStatetoProps,{
  getUserDetails
})(StudentHomepage));