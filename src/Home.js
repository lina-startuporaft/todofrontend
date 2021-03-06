import React, {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import Head from './components/Head.js'
import DoList from './DoList.js'
import styles from './style/App.module.css'
import { Pagination, message } from 'antd';
import 'antd/dist/antd.css'
const axios = require('axios');
const config = require('./config.js');


function Home() {
  
  const [tasks, setTasks] = useState([]);
  const [numberPage, setNumberPage] = useState(1);
  const [orderBy, setOrderBy] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    upgradeTasks(orderBy, filterBy, page);
  }, [orderBy, filterBy, page]);

  axios.interceptors.request.use((req) => {
    req.headers.authorization = localStorage.getItem('token');
    return req
  });

  axios.interceptors.response.use((res) => {
    return res
  }, (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      navigate('/login');
    } else {
      if (err?.response?.data === 'this task already exists') {
        throw new Error('this task already exists');
      } else {
        throw new Error(err.message);
      }
    }
  })

  const upgradeTasks = async (orderBy, filterBy, page) => {
    try {
      const resultReq  = await axios(`${config.url}/api/tasks`,{
      params: {
        filterBy: filterBy,
        order: orderBy,
        pp: 5,
        page: page,
      }
    });
    let newArr = resultReq.data.rows.map((task) => {
      return {title: task.name, id: task.uuid , checked: task.done, date: task.createdAt}
    });
    setNumberPage(Math.ceil(resultReq.data.count / 5));
    setTasks(newArr);
    } catch (err) {
      if (err.message === 'Request failed with status code 401' || !localStorage.getItem('token')) {
        navigate('/login');
      } else {
        message.error(`${err.name}:${err.message}`);
      }
    }
  }

  const addDo = async ({nameTask}) => {
    try {
      const resultReq = await axios.post(`${config.url}/api/tasks`, {
        "name": nameTask,
        "done": false,
      });
      await upgradeTasks(orderBy, filterBy, page);
    } catch (err) {
      if (err.message == 'Request failed with status code 400') {
        message.error('there is already a task');
      } else {
        message.error(`${err.name}:${err.message}`);
      }
    }
  }

  const delDo = async (e) => {
    try {
      const resultReq = await axios.delete(`${config.url}/api/tasks`, {
        params: {
          uuid: e.currentTarget.id,
        }
      });
      await upgradeTasks(orderBy, filterBy, page);
      if ((numberPage === page) && (tasks.length == 1) && (page != 1)) {
        setPage(numberPage - 1);
      }
    } catch(err) {
      message.error(`${err.name}:${err.message}`);
    }
  }

  const editTaskGlobal = async (name, id, checked) => {
    try {
      const resultReq = await axios.patch(`${config.url}/api/tasks`, {
      "name": name,
      "done": checked,
      "uuid": id,
      });
      await upgradeTasks(orderBy, filterBy, page);
      console.log(resultReq);
      return true
    } catch(err) {
      message.error(err.message);
    }

  }

  const sort = (e) => {
    setOrderBy(e.currentTarget.value);
  }

  const currentFilter = (e) => {
    setFilterBy(e.currentTarget.value);
    setPage(1);
  }

  const checkPage = (current) => {
        setPage(current);
  }

  return (
          <div className={styles.mybody}>
            <Head 
              addDo={addDo}
              sort={sort}
              currentFilter={currentFilter}
              filterBy={filterBy}
              orderBy={orderBy}
              />
              <div className={styles.content}>
                <DoList 
                  tasks={tasks}
                  delDo={delDo}
                  editTaskGlobal={editTaskGlobal}/>
                    <Pagination 
                      defaultCurrent={1}
                      current={page}
                      total={numberPage*10}
                      onChange={checkPage}
                      showSizeChanger={false}
                      className={styles.pagingconteiner}
                      hideOnSinglePage={true}/>  
              </div>
          </div>
        )
}

export default Home;