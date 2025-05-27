const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require('../config/localDB');

const ProjectMeeting = sequelize.define(
    "ProjectMeeting",
    {
        projectMeeting_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
        MeetingText:{
            type: DataTypes.TEXT,
            allowNull: true,
        },
        meetingDate: {
            type: DataTypes.DATE,
            allowNull: false
          },
    },
    
    {
        tableName: "project_meeting",
        timestamps: false,
      }
);

module.exports = ProjectMeeting;