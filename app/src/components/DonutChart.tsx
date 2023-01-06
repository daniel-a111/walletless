import { useEffect, useState } from "react";
import * as walletless from '../walletless'
import * as storage from '../storage'
import '../scss/components/donut.scss';

const DonutChart = ({balances}: any) => {

    const [mount, setMount] = useState<boolean>(false);

    return <div className="container">
    <div className="donut-chart-block block"> 
          <div className="donut-chart">
              <div id="part1" className="portion-block"><div className="circle"></div></div>
              <div id="part2" className="portion-block"><div className="circle"></div></div>
              <div id="part3" className="portion-block"><div className="circle"></div></div>
              <p className="center"></p>        
          </div>
     </div>
  </div>;
}
export default DonutChart;