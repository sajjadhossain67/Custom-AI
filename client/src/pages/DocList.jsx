import React, { useEffect, useState } from "react";
import { axiosSecure } from "../services/api/axios";
import {
  Avatar,
  Box,
  Button,
  CardActions,
  Container,
  CssBaseline,
  Divider,
  Grid,
  Stack,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { CardActionArea } from "@mui/material";
import { Link } from "react-router-dom";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const DocList = () => {
  const user = {
    avatar: "/assets/avatars/avatar-anika-visser.png",
    city: "Los Angeles",
    country: "USA",
    jobTitle: "Senior Developer",
    name: "Anika Visser",
    timezone: "GTM-7",
  };
  const [botList, setBotList] = useState([]);
  const [isFetchingBotList, setIsFetchingBotList] = useState(false);
  const userName = JSON.parse(localStorage.getItem("userName"));
  const userEmail = JSON.parse(localStorage.getItem("email"));
  const role = JSON.parse(localStorage.getItem("role"));

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };


  useEffect(() => {
    fetchBotsList();
  }, []);

  const fetchBotsList = async () => {
    try {
      setIsFetchingBotList(true);
      const response = await axiosSecure.get("/chatbots");
      console.log(response.data);
      if (response.data) {
        setBotList(response.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsFetchingBotList(false);
    }
  };

  const handleBotDelete = async (id) => {
    const confirm = window.confirm("Are you sure??");
    if (confirm) {
      console.log("delete for", id);
      try {
        const payload = { is_deleted: true };
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/api/v1/chatbots/${id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          window.location.reload();
          console.log(response);
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  

  return (
    <Box
      sx={{
        py: 1,
      }}
    >
      <CssBaseline />
      <Container maxWidth="xl" disableGutters>
        <Stack spacing={3}>
          <div>
            <Typography
              variant="h4"
              sx={{
                marginTop: 2,
                marginBottom: 5,
                background: "#e5e5e5",
                borderRadius: "10px",
                padding: 2,
              }}
            >
              Welcome
            </Typography>
          </div>
          <div>
            <Grid container spacing={2}>
              {/* <Grid xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    color: "#FFF",
                    maxWidth: "350px",
                    boxShadow:
                      "rgba(0, 0, 0, 0.04) 0px 5px 22px, rgba(0, 0, 0, 0.03) 0px 0px 0px 0.5px",
                    borderRadius: "20px",
                    background: "#40414F",
                  }}
                >
                  <CardContent sx={{ padding: "32px 24px" }}>
                    <Box
                      sx={{
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Avatar
                        src={user.avatar}
                        sx={{
                          height: 80,
                          mb: 2,
                          width: 80,
                        }}
                      />
                      <Typography
                        sx={{ textTransform: "uppercase" }}
                        gutterBottom
                        variant="h5"
                      >
                        {userName}
                      </Typography>
                      <Typography sx={{ color: "#e5e5e5" }} variant="body2">
                        {user.city} {user.country}
                      </Typography>
                      <Typography sx={{ color: "#e5e5e5" }} variant="body2">
                        {user.timezone}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button
                      sx={{
                        padding: "5px 0",
                        color: "#999999",
                        textTransform: "lowercase",
                      }}
                      fullWidth
                      variant="text"
                    >
                      {userEmail}
                    </Button>
                  </CardActions>
                </Card>
              </Grid> */}
              <Grid xs={12} md={12} lg={12}>
                <Box>
                  {isFetchingBotList ? (
                    <p>loading bts......</p>
                  ) : (
                    <section className="container">
                      <Grid
                        container
                        spacing={{ xs: 2, md: 3 }}
                        columns={{ xs: 4, sm: 8, md: 4, xl: 12, lg: 8 }}
                      >
                        {(botList || []).map((chatbot, index) => (
                          <Grid item xs={2} sm={4} md={4} key={index}>
                            <Card
                              sx={{
                                maxWidth: 365,
                                // height: 300,
                                minHeight: 270,
                                boxShadow:
                                  "rgba(0, 0, 0, 0.04) 0px 5px 22px, rgba(0, 0, 0, 0.03) 0px 0px 0px 0.5px",
                              }}
                            >
                              <div style={{
                                display: "flex",
                                justifyContent: "end"
                              }}>
                                <div>
                                  <Button
                                    id="basic-button"
                                    aria-controls={open ? 'basic-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={open ? 'true' : undefined}
                                    onClick={handleClick}
                                  >
                                    <MoreVertIcon />
                                  </Button>
                                  <Menu
                                    id="basic-menu"
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleClose}
                                    MenuListProps={{
                                      'aria-labelledby': 'basic-button',
                                    }}
                                  >
                                    <Link
                                    style={{
                                      textDecoration: 'none'
                                    }}
                                     to={`/public/${chatbot._id}`}>
                                    <MenuItem onClick={handleClose}>
                                    <Button
                                    >
                                      Share
                                    </Button>
                                    </MenuItem>
                                    </Link>
                                   
                                    <MenuItem onClick={handleClose}>
                                    <Button
                                      onClick={() => {
                                        handleBotDelete(chatbot._id);
                                      }}
                                      style={{
                                        color: 'red'
                                      }}
                                    >
                                      delete
                                    </Button>
                                    </MenuItem>
                                    <MenuItem onClick={handleClose}>
                                    <Button
                                   
                                    >
                                     Edit
                                    </Button>
                                    </MenuItem>
                                  </Menu>
                                </div>
                              </div>
                              <CardActionArea>
                                <CardMedia
                                  sx={{
                                    borderRadius: "50%",
                                    padding: "10px",
                                    objectFit: "contain",
                                  }}
                                  component="img"
                                  height="150"
                                  image="/bot-1.png"
                                  alt="green iguana"
                                />
                                <CardContent>
                                  <Typography
                                    gutterBottom
                                    variant="h5"
                                    component="div"
                                    sx={{
                                      textOverflow: "ellipsis",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {chatbot?.botName}
                                  </Typography>
                                  <Link to={`/chat/${chatbot._id}`}>
                                    <Button
                                      sx={{
                                        width: "100%",
                                        border: "1px dotted rgb(99, 102, 241)",
                                        fontWeight: 700,
                                        color: "#fff",
                                        textTransform: "capitalize",
                                        background: "rgb(99, 102, 241)",
                                      }}
                                      variant="contained"
                                    >
                                      Chat With Bot
                                    </Button>
                                  </Link>

                                  {/* share bot or delete */}
                                  <div
                                  
                                  >
                                    {/* share button */}
                                    {/* <Link to={`/public/${chatbot._id}`}>
                                      <Button
                                        sx={{
                                          width: "100%",
                                          border:
                                            "1px dotted rgb(99, 102, 241)",
                                          fontWeight: 700,
                                          color: "#fff",
                                          textTransform: "capitalize",
                                          background: "rgb(99, 102, 241)",
                                          marginTop: "5px",
                                        }}
                                        variant="contained"
                                      >
                                        share
                                      </Button>
                                    </Link> */}

                                    {/* delete bot */}
                                    {/* <Button
                                      onClick={() => {
                                        handleBotDelete(chatbot._id);
                                      }}
                                      sx={{
                                        width: "100%",
                                        border: "1px dotted rgb(99, 102, 241)",
                                        fontWeight: 700,
                                        color: "red",
                                        textTransform: "capitalize",
                                        background: "#fff",
                                        marginTop: "5px",
                                      }}
                                      variant="contained"
                                    >
                                      delete
                                    </Button> */}
                                  </div>
                                </CardContent>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </section>
                  )}
                </Box>
              </Grid>
            </Grid>
          </div>
        </Stack>
      </Container>
    </Box>
  );
};

export default DocList;
