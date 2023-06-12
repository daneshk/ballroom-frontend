import { Button, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { getChallenge, getContest, getOwnedChallengeIds, getSharedChallengeIds } from "../api/admin";
import { getChallengesInContest } from "../api/common";
import { Layout } from "../components/templates";
import { IMinimalContest } from "../helpers/interfaces";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import { Link } from "react-router-dom";
import LeaderboardTable from "../components/LeaderboardTable";
import { useApp } from "../hooks/useApp";
import { AxiosResponse } from "axios";
import { getReadmeContest } from "../api/contestant";
import { axiosPrivate } from "../api/axios";
import MarkdownRenderer from "../helpers/MarkdownRenderer";

type ContestId = {
    contestId: string;
};

type Challenge = {
    challengeId: string;
    title: string;
    difficulty: string;
};

const PastContestControlView = () => {

    const {contestId} = useParams<ContestId>();
    const location = useLocation();
    const [contest, setcontest] = useState<IMinimalContest>();
    const [challenges, setchallenges] = useState<Challenge[]>([]);
    const [selectedTab, setselectedTab] = useState(0);
    const axiosIns = useAxiosPrivate();
    const {appState} = useApp();
    const userId = appState.auth.userID;
    const [ownedchallengeIds, setownedchallengeids] = useState<string[]>([]);
    const [sharedchallengeIds, setsharedchallengeids] = useState<string[]>([]);
    const [post, setPost] = useState('');

    const handleRecievedChallengeArray = (res: any) => {
        res.data.forEach((challengeId: any) => {
            getChallenge(axiosIns, challengeId).then((res: any) => setchallenges((prevstate) => prevstate ? [...prevstate, {challengeId: res.data.challengeId,title: res.data.title, difficulty: res.data.difficulty}] : [{challengeId: res.data.challengeId,title: res.data.title, difficulty: res.data.difficulty}])).
            catch((res: any)=> console.log(res.data));
            
        });
    }

    const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
        setselectedTab(newValue);
    };

    const getReadmeFail = () => {
        console.log("Getting readme failed")
    }

    const getReadmeSucess = (res : AxiosResponse) => {
        var link = document.createElement("a");
        link.href = window.URL.createObjectURL(new Blob([res.data], { type: 'text/markdown' }));
        fetch(link.href).then((res) => res.text()).then((res) => setPost(res));
    }

    useEffect(() => {
        getChallengesInContest( axiosIns, contestId!, handleRecievedChallengeArray, (err: any) => console.log(err))
        getContest(axiosIns, contestId!,(res: any) => {setcontest(res.data)}, () => console.log("ËRROR OCCURRED"));
        getSharedChallengeIds(axiosIns, userId!,(res: any) => {setsharedchallengeids(res.data)}, () => console.log("ËRROR OCCURRED"));
        getOwnedChallengeIds(axiosIns, userId!,(res: any) => {setownedchallengeids(res.data)}, () => console.log("ËRROR OCCURRED")); 
        getReadmeContest(axiosPrivate, contestId!, getReadmeSucess, getReadmeFail);
    },[]);
    
    return ( 
        <Layout>
            <Typography variant="h4" textAlign="center" fontWeight={"bold"} gutterBottom>
                {contest ? contest.title : "Loading..."}
            </Typography>

            <Tabs value={selectedTab} onChange={handleChangeTab} centered>
                <Tab label="ABOUT" />
                <Tab label="CHALLENGES" />
                <Tab label="LEADERBOARD" />
            </Tabs>

            {selectedTab === 0 && 
            <>
                <div>
                    <MarkdownRenderer source={post} />
                </div>
            </>
            }

            {selectedTab === 1 && 
                    challenges && challenges.map((challenge) => (

                        <Card key={challenge.challengeId} sx={{marginY: '1rem', width: '100%'}} >
    
                            <CardContent>
                                <Typography variant="h5" component="div">
                                {challenge.title}
                                </Typography>
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                {challenge.difficulty}
                                </Typography>
                            </CardContent>  
    
                            <CardActions>
                                {(sharedchallengeIds.includes(challenge.challengeId) || ownedchallengeIds.includes(challenge.challengeId) )&&<Link to={`${location.pathname}/${challenge.challengeId}`}><Button size="small">View</Button></Link>}
                                {(!ownedchallengeIds.includes(challenge.challengeId) && !sharedchallengeIds.includes(challenge.challengeId)) && <Typography variant="body2" color="darkorange" sx={{marginX: 2}}>You Don't Have Access</Typography>}
                            </CardActions>
    
                        </Card>
            ))}

            {selectedTab === 2 && <LeaderboardTable contestId={contestId!}/>}

        </Layout>
    );
}
 
export default PastContestControlView;