import java.io.*;
import java.nio.file.*;
import java.util.*;
import lib.kemi.chem.Chem;
import lib.kemi.readDataLib.ReadDataLib;
import lib.kemi.readWriteDataFiles.ReadChemSyst;
import lib.kemi.haltaFall.*;
/** Research adapter only; unchanged official library; explicit total passed as argument. */
public class PourbaixProbe {
 public static void main(String[] args) throws Exception {
  PrintStream quiet=new PrintStream(OutputStream.nullOutputStream());
  for(String row:Files.readAllLines(Path.of(args[1]))){
   String[] v=row.split(",");ReadDataLib reader=new ReadDataLib(new File(args[0]));
   Chem chem=ReadChemSyst.readChemSyst(reader,false,quiet);reader.close();
   var cs=chem.chemSystem;var c=cs.chemConcs;
   c.kh[0]=1;c.tot[0]=Double.parseDouble(args[2]);for(int i=1;i<cs.Na;i++)c.kh[i]=2;
   c.logA[1]=-Double.parseDouble(v[1]);c.logA[2]=-Double.parseDouble(v[3]);c.logA[3]=0;
   c.temperature=25;c.pressure=1;c.activityCoeffsModel=-1;c.ionicStr=0;c.tol=1e-10;c.dbg=0;c.cont=false;
   new HaltaFall(cs,new Factor(chem,null,null,null,quiet),quiet).haltaCalc();
   System.out.println("{\"index\":"+v[0]+",\"flags\":"+c.errFlags+",\"C\":"+Arrays.toString(c.C)+",\"tot\":"+Arrays.toString(c.tot)+",\"solub\":"+Arrays.toString(c.solub)+"}");
  }
 }
}
